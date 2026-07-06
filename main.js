"use strict";

const https = require("node:https");
const { URL, URLSearchParams } = require("node:url");
const utils = require("@iobroker/adapter-core");

const SENSOR_DEFINITIONS = [
    ["acPower", "AC Power", "number", "W", "value.power"],
    ["acVoltage", "AC Voltage", "number", "V", "value.voltage"],
    ["acFrequency", "AC Frequency", "number", "Hz", "value.frequency"],
    ["acElectric", "AC Current", "number", "A", "value.current"],
    ["pv1Power", "PV1 Power", "number", "W", "value.power"],
    ["pv2Power", "PV2 Power", "number", "W", "value.power"],
    ["pv1Voltage", "PV1 Voltage", "number", "V", "value.voltage"],
    ["pv2Voltage", "PV2 Voltage", "number", "V", "value.voltage"],
    ["pv1Electric", "PV1 Current", "number", "A", "value.current"],
    ["pv2Electric", "PV2 Current", "number", "A", "value.current"],
    ["inPower", "Input Power", "number", "W", "value.power"],
    ["temperature", "Temperature", "number", "°C", "value.temperature"],
    ["batteryVoltage", "Battery Voltage", "number", "V", "value.voltage"],
    ["batteryCurrent", "Battery Current", "number", "A", "value.current"],
    ["batteryPower", "Battery Power", "number", "W", "value.power"],
    ["loadPower", "Load Power", "number", "W", "value.power"],
    ["controllerTemperature", "Controller Temperature", "number", "°C", "value.temperature"],
];

const STATION_DEFINITIONS = [
    ["dailyPowerGeneration", "Daily Power Generation", "number", "kWh", "value.energy"],
    ["monthlyElectricityGeneration", "Monthly Electricity Generation", "number", "kWh", "value.energy"],
    ["totalPowerGeneration", "Total Power Generation", "number", "kWh", "value.energy"],
    ["currentPower", "Current Power", "number", "W", "value.power"],
    ["incomeOfTheDay", "Income Of The Day", "number", "", "value"],
    ["currentMonthsIncome", "Current Month Income", "number", "", "value"],
    ["cumulativeIncome", "Cumulative Income", "number", "", "value"],
    ["saveStandardCoal", "Saved Standard Coal", "number", "", "value"],
    ["emissionReductionCO2", "Emission Reduction CO2", "number", "", "value"],
    ["protectTrees", "Protected Trees", "number", "", "value"],
    ["inverterTotal", "Inverter Total", "number", "", "value"],
    ["inOnCount", "Online Inverters", "number", "", "value"],
];

const COLLECTOR_DEFINITIONS = [
    ["collectorId", "Collector ID", "string", "", "text"],
    ["collectorName", "Collector Name", "string", "", "text"],
    ["inverterId", "Inverter ID", "string", "", "text"],
    ["inverterName", "Inverter Name", "string", "", "text"],
    ["communicationStatus", "Communication Status", "string", "", "text"],
    ["onlineStatus", "Online Status", "string", "", "text"],
    ["networkStatus", "Network Status", "number", "", "value"],
    ["inPower", "Input Power", "number", "W", "value.power"],
    ["ipAddress", "IP Address", "string", "", "text"],
    ["onlineTime", "Online Time", "string", "", "date"],
    ["exhibitionTime", "Exhibition Time", "string", "", "date"],
    ["collectorType", "Collector Type", "string", "", "text"],
    ["equipmentType", "Equipment Type", "string", "", "text"],
    ["modelReplace", "Model", "string", "", "text"],
];

class AbsaarAdapter extends utils.Adapter {
    constructor(options = {}) {
        super({ ...options, name: "absaar" });
        this.token = "";
        this.userId = "";
        this.pollTimer = null;
        this.isPolling = false;
        this.on("ready", () => this.onReady());
        this.on("unload", callback => this.onUnload(callback));
    }

    async onReady() {
        await this.initInfoObjects();
        if (this.config.enabled === false) {
            this.log.info("Absaar adapter is disabled");
            await this.setStateAsync("info.connection", false, true);
            return;
        }
        if (!this.config.username || !this.config.password) {
            await this.setError("Username or password missing");
            return;
        }
        await this.poll();
        const interval = Math.max(30, Number(this.config.pollInterval || 120));
        this.pollTimer = this.setInterval(() => void this.poll(), interval * 1000);
    }

    onUnload(callback) {
        try {
            if (this.pollTimer) this.clearInterval(this.pollTimer);
            callback();
        } catch {
            callback();
        }
    }

    async initInfoObjects() {
        await this.setObjectNotExistsAsync("info", { type: "channel", common: { name: "Information" }, native: {} });
        await this.ensureState("info.connection", "Connection", "boolean", "", true, false, "indicator.connected");
        await this.ensureState("info.lastUpdate", "Last update", "string", "", true, false, "date");
        await this.ensureState("info.lastError", "Last error", "string", "", true, false, "text");
    }

    async poll() {
        if (this.isPolling) return;
        this.isPolling = true;
        try {
            const data = await this.fetchAllData();
            await this.writeData(data);
            await this.setStateAsync("info.connection", true, true);
            await this.setStateAsync("info.lastError", "", true);
            await this.setStateAsync("info.lastUpdate", new Date().toISOString(), true);
        } catch (error) {
            await this.setError(error && error.message ? error.message : String(error));
        } finally {
            this.isPolling = false;
        }
    }

    async setError(message) {
        await this.setStateAsync("info.connection", false, true);
        await this.setStateAsync("info.lastError", message, true);
        this.log.warn(message);
    }

    async authenticate() {
        const data = await this.post("/dn/userLogin", {
            username: this.config.username,
            password: this.config.password,
        }, {
            "User-Agent": "okhttp-okgo/jeasonlzy",
            "Content-Type": "application/json;charset=utf-8",
        });
        if (!data || !data.token) throw new Error(`Login failed: ${JSON.stringify(data)}`);
        this.token = String(data.token);
        this.userId = String(data.userId || "");
    }

    async request(path, payload, json = true) {
        if (!this.token) await this.authenticate();
        let data = await this.post(path, payload, { Authorization: this.token }, json);
        if (data && data.code === 401) {
            this.token = "";
            await this.authenticate();
            data = await this.post(path, payload, { Authorization: this.token }, json);
        }
        if (!data || data.code !== 200) throw new Error(`API request ${path} failed: ${JSON.stringify(data)}`);
        return data;
    }

    async fetchAllData() {
        await this.authenticate();
        const stationsData = await this.request("/dn/power/station/listApp", { userId: this.userId }, false);
        if (!stationsData.rows) throw new Error("No stations returned by Absaar API");
        const result = { stations: [] };
        for (const station of stationsData.rows) {
            const powerId = String(station.powerId);
            const stationInfo = {
                power_id: powerId,
                power_name: station.powerName || powerId,
                data: station,
                collectors: [],
            };
            const collectorsData = await this.request("/dn/power/collector/listByApp", { powerId }, true);
            for (const collector of collectorsData.rows || []) {
                const inverterId = String(collector.inverterId);
                const inverterData = await this.request("/dn/power/inverterData/inverterDatalist", { powerId, inverterId }, true);
                stationInfo.collectors.push({
                    inverter_id: inverterId,
                    collector_id: String(collector.collectorId || inverterId),
                    collector_name: collector.collectorName || collector.inverterName || inverterId,
                    collector_data: collector,
                    inverter_data: inverterData.rows && inverterData.rows[0] ? inverterData.rows[0] : {},
                    data: { ...collector, ...(inverterData.rows && inverterData.rows[0] ? inverterData.rows[0] : {}) },
                });
            }
            result.stations.push(stationInfo);
        }
        return result;
    }

    async post(path, payload, headers, json = true) {
        const base = String(this.config.baseUrl || "https://mini-ems.com:8081").replace(/\/$/, "");
        const url = new URL(`${base}${path}`);
        const body = json ? JSON.stringify(payload || {}) : new URLSearchParams(payload || {}).toString();
        const options = {
            method: "POST",
            hostname: url.hostname,
            port: url.port || 443,
            path: `${url.pathname}${url.search}`,
            headers: {
                ...headers,
                "Content-Length": Buffer.byteLength(body),
            },
            rejectUnauthorized: false,
            timeout: 15000,
        };
        if (json) options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json;charset=utf-8";

        return new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                const chunks = [];
                res.on("data", chunk => chunks.push(chunk));
                res.on("end", () => {
                    const text = Buffer.concat(chunks).toString("utf8");
                    try {
                        resolve(JSON.parse(text));
                    } catch {
                        reject(new Error(`Invalid JSON from ${path}: ${text.slice(0, 200)}`));
                    }
                });
            });
            req.on("timeout", () => req.destroy(new Error(`Timeout calling ${path}`)));
            req.on("error", reject);
            req.write(body);
            req.end();
        });
    }

    async writeData(data) {
        await this.ensureState("rawJson", "Raw JSON", "string", "", true, false, "json");
        if (this.config.writeRawJson) await this.setStateAsync("rawJson", JSON.stringify(data), true);
        for (const station of data.stations || []) {
            const stationId = this.safeId(station.power_id);
            const stationBase = `stations.${stationId}`;
            await this.ensureChannel("stations", "Stations");
            await this.ensureChannel(stationBase, station.power_name || station.power_id);
            for (const [key, name, type, unit, role] of STATION_DEFINITIONS) {
                await this.ensureState(`${stationBase}.${key}`, name, type, unit, true, false, role);
                await this.setValue(`${stationBase}.${key}`, type, station.data ? station.data[key] : undefined);
            }

            for (const collector of station.collectors || []) {
                const inverterId = this.safeId(collector.inverter_id);
                const base = `${stationBase}.inverters.${inverterId}`;
                await this.ensureChannel(`${stationBase}.inverters`, "Inverters");
                await this.ensureChannel(base, collector.collector_name || collector.inverter_id);
                for (const [key, name, type, unit, role] of COLLECTOR_DEFINITIONS) {
                    await this.ensureState(`${base}.${key}`, name, type, unit, true, false, role);
                    await this.setValue(`${base}.${key}`, type, collector.data ? collector.data[key] : undefined);
                }
                for (const [key, name, type, unit, role] of SENSOR_DEFINITIONS) {
                    await this.ensureState(`${base}.${key}`, name, type, unit, true, false, role);
                    await this.setNumber(`${base}.${key}`, collector.data ? collector.data[key] : undefined);
                }
                if (this.config.writeRawJson) {
                    await this.ensureState(`${base}.rawJson`, "Raw inverter JSON", "string", "", true, false, "json");
                    await this.setStateAsync(`${base}.rawJson`, JSON.stringify({
                        collector: collector.collector_data || {},
                        inverter: collector.inverter_data || {},
                    }), true);
                }
            }
        }
    }

    async ensureChannel(id, name) {
        await this.setObjectNotExistsAsync(id, { type: "channel", common: { name }, native: {} });
    }

    async ensureState(id, name, type, unit, read, write, role) {
        await this.setObjectNotExistsAsync(id, {
            type: "state",
            common: {
                name,
                type,
                role: role || (type === "boolean" ? "indicator" : type === "number" ? "value" : "text"),
                read,
                write,
                unit: unit || undefined,
                def: type === "number" ? 0 : type === "boolean" ? false : "",
            },
            native: {},
        });
    }

    async setNumber(id, value) {
        const num = this.toNumber(value);
        if (Number.isFinite(num)) await this.setStateAsync(id, num, true);
    }

    async setValue(id, type, value) {
        if (value === null || value === undefined) return;
        if (type === "number") {
            await this.setNumber(id, value);
            return;
        }
        if (type === "boolean") {
            await this.setStateAsync(id, value === true || value === "true" || value === 1 || value === "1", true);
            return;
        }
        await this.setStateAsync(id, String(value), true);
    }

    toNumber(value) {
        if (value === null || value === undefined || value === "") return NaN;
        const num = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
        return Number.isFinite(num) ? num : NaN;
    }

    safeId(value) {
        return String(value || "unknown").replace(/[^a-zA-Z0-9_.-]/g, "_");
    }
}

if (require.main !== module) {
    module.exports = options => new AbsaarAdapter(options);
} else {
    new AbsaarAdapter();
}
