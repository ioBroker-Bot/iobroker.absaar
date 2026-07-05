# ioBroker.absaar

ioBroker adapter for Absaar EMS inverters. The adapter reads inverter and station data from the Absaar EMS cloud API used by the Absaar EMS app.

This adapter is intentionally vendor-neutral in its code and configuration. It does not contain private credentials, private host names, or user-specific data.

## English

### Features

- Cloud polling via `https://mini-ems.com:8081`
- Login with Absaar EMS app credentials
- Automatic token handling and re-authentication
- Configurable polling interval
- Station states for daily and total energy generation
- Additional station states such as current power, monthly generation and API income/environment counters
- Collector states such as input power, online status, collector name and last online time
- Inverter states for AC, PV, temperature, battery and load values
- Optional raw JSON state for troubleshooting
- Materialize admin configuration

### Requirements

- ioBroker js-controller `>= 5.0.0`
- Node.js `>= 18`
- An Absaar EMS account with at least one inverter/station added in the Absaar EMS app
- Network access from the ioBroker host to `mini-ems.com:8081`

### Configuration

Open the adapter instance configuration in ioBroker Admin.

| Setting | Description |
| --- | --- |
| Adapter active | Enables or disables polling. |
| Absaar username | Username used in the Absaar EMS app. Depending on the account this may be an email address or a username. |
| Absaar password | Password used in the Absaar EMS app. Stored as encrypted/protected native config by ioBroker. |
| Poll interval seconds | Polling interval in seconds. Default is `120`. Do not set this too low to avoid cloud rate limiting. |
| API base URL | Default: `https://mini-ems.com:8081`. Normally this should not be changed. |
| Store raw data as JSON | Writes the full fetched JSON into states for troubleshooting. Disabled by default. |

### Created states

The adapter creates states below:

```text
absaar.0.info.*
absaar.0.stations.<stationId>.*
absaar.0.stations.<stationId>.inverters.<inverterId>.*
```

#### Info states

| State | Type | Description |
| --- | --- | --- |
| `info.connection` | boolean | `true` if the last poll succeeded. |
| `info.lastUpdate` | string | ISO timestamp of the last successful update. |
| `info.lastError` | string | Last error message. Empty after a successful poll. |

#### Station states

| State | Unit | Description |
| --- | --- | --- |
| `dailyPowerGeneration` | kWh | Daily generated energy reported by the Absaar API. |
| `monthlyElectricityGeneration` | kWh | Monthly generated energy reported by the Absaar API. |
| `totalPowerGeneration` | kWh | Total generated energy reported by the Absaar API. |
| `currentPower` | W | Current station power reported by the Absaar API. |
| `incomeOfTheDay` |  | Daily income counter reported by the API. |
| `currentMonthsIncome` |  | Monthly income counter reported by the API. |
| `cumulativeIncome` |  | Cumulative income counter reported by the API. |
| `saveStandardCoal` |  | Environmental counter reported by the API. |
| `emissionReductionCO2` |  | CO2 reduction counter reported by the API. |
| `protectTrees` |  | Tree protection counter reported by the API. |
| `inverterTotal` |  | Number of assigned inverters. |
| `inOnCount` |  | Number of online inverters. |

#### Collector states

Collector states are created below `stations.<stationId>.inverters.<inverterId>`. They are created even if the separate inverter data endpoint returns no rows.

| State | Unit | Description |
| --- | --- | --- |
| `collectorId` |  | Collector ID |
| `collectorName` |  | Collector name |
| `inverterId` |  | Inverter ID |
| `inverterName` |  | Inverter name |
| `communicationStatus` |  | Communication status reported by the API |
| `onlineStatus` |  | Online status reported by the API |
| `networkStatus` |  | Numeric network status |
| `inPower` | W | Input/current power reported in the collector list |
| `ipAddress` |  | Cloud-side IP address reported by the API |
| `onlineTime` |  | Last online timestamp |
| `exhibitionTime` |  | Last data timestamp shown by the API |
| `collectorType` |  | Collector type |
| `equipmentType` |  | Equipment type |
| `modelReplace` |  | Model identifier |

#### Inverter states

| State | Unit | Description |
| --- | --- | --- |
| `acPower` | W | AC output power |
| `acVoltage` | V | AC voltage |
| `acFrequency` | Hz | AC frequency |
| `acElectric` | A | AC current |
| `pv1Power` | W | PV input 1 power |
| `pv2Power` | W | PV input 2 power |
| `pv1Voltage` | V | PV input 1 voltage |
| `pv2Voltage` | V | PV input 2 voltage |
| `pv1Electric` | A | PV input 1 current |
| `pv2Electric` | A | PV input 2 current |
| `inPower` | W | Input power reported by the API |
| `temperature` | °C | Inverter temperature |
| `batteryVoltage` | V | Battery voltage, if reported by the device |
| `batteryCurrent` | A | Battery current, if reported by the device |
| `batteryPower` | W | Battery power, if reported by the device |
| `loadPower` | W | Load power, if reported by the device |
| `controllerTemperature` | °C | Controller temperature, if reported by the device |

Not every Absaar device reports every field. Missing values are left unchanged until the API reports a valid numeric value.

### Polling behavior

The default poll interval is 120 seconds. Keep this interval conservative to avoid unnecessary cloud API load.

### Troubleshooting

1. Check `absaar.0.info.connection`.
2. Check `absaar.0.info.lastError`.
3. Verify that the same credentials work in the Absaar EMS app.
4. Keep the poll interval at 120 seconds or higher while testing.
5. Enable raw JSON only temporarily, because it can create large states depending on the API response.

### Version history

#### 0.1.3

- Updated package metadata for ioBroker repository checks.
- Raised the minimum Node.js requirement to Node.js 20.
- Added repository, author, license information, tier and extended translations.

#### 0.1.2

- Documentation cleanup for publication.
- Added this version history.

#### 0.1.1

- Added collector states even if detailed inverter data is not returned.
- Added additional station metrics such as current power, monthly generation and environment counters.
- Expanded German and English documentation.

#### 0.1.0

- Initial cloud polling adapter.
- Added login, station polling, collector polling and inverter data polling.
- Added Materialize admin configuration.

## Deutsch

### Funktionen

- Cloud-Abfrage ueber `https://mini-ems.com:8081`
- Anmeldung mit den Zugangsdaten der Absaar EMS App
- Automatische Token-Verwaltung und erneute Anmeldung
- Einstellbares Abfrageintervall
- Stationswerte fuer Tages- und Gesamterzeugung
- Weitere Stationswerte wie aktuelle Leistung, Monatserzeugung und API-Zaehler fuer Ertrag/Umweltwerte
- Collector-Datenpunkte wie Eingangsleistung, Online-Status, Collector-Name und letzte Online-Zeit
- Wechselrichterwerte fuer AC, PV, Temperatur, Batterie und Last
- Optionale Rohdaten als JSON zur Fehlersuche
- Materialize Admin-Konfiguration

### Voraussetzungen

- ioBroker js-controller `>= 5.0.0`
- Node.js `>= 18`
- Ein Absaar EMS Konto mit mindestens einem in der Absaar EMS App eingerichteten Wechselrichter beziehungsweise einer Station
- Netzwerkzugriff vom ioBroker-Host auf `mini-ems.com:8081`

### Konfiguration

Die Einstellungen werden in der Instanzkonfiguration des Adapters im ioBroker Admin vorgenommen.

| Einstellung | Beschreibung |
| --- | --- |
| Adapter aktiv | Aktiviert oder deaktiviert die Abfrage. |
| Absaar Benutzername | Benutzername aus der Absaar EMS App. Je nach Konto kann das auch eine E-Mail-Adresse sein. |
| Absaar Passwort | Passwort aus der Absaar EMS App. Wird von ioBroker als geschuetzte/verschluesselte Native-Konfiguration gespeichert. |
| Poll-Intervall Sekunden | Abfrageintervall in Sekunden. Standard ist `120`. Nicht zu niedrig einstellen, um Sperren durch zu viele Cloud-Abfragen zu vermeiden. |
| API Basis-URL | Standard: `https://mini-ems.com:8081`. Normalerweise nicht aendern. |
| Rohdaten als JSON speichern | Speichert die komplette API-Antwort zur Fehlersuche in States. Standardmaessig deaktiviert. |

### Angelegte Datenpunkte

Der Adapter legt Datenpunkte unterhalb dieser Struktur an:

```text
absaar.0.info.*
absaar.0.stations.<stationId>.*
absaar.0.stations.<stationId>.inverters.<inverterId>.*
```

#### Info-Datenpunkte

| Datenpunkt | Typ | Beschreibung |
| --- | --- | --- |
| `info.connection` | boolean | `true`, wenn die letzte Abfrage erfolgreich war. |
| `info.lastUpdate` | string | ISO-Zeitstempel der letzten erfolgreichen Aktualisierung. |
| `info.lastError` | string | Letzte Fehlermeldung. Wird nach erfolgreicher Abfrage geleert. |

#### Stations-Datenpunkte

| Datenpunkt | Einheit | Beschreibung |
| --- | --- | --- |
| `dailyPowerGeneration` | kWh | Tageserzeugung laut Absaar API. |
| `monthlyElectricityGeneration` | kWh | Monatserzeugung laut Absaar API. |
| `totalPowerGeneration` | kWh | Gesamterzeugung laut Absaar API. |
| `currentPower` | W | Aktuelle Stationsleistung laut Absaar API. |
| `incomeOfTheDay` |  | Tagesertragszaehler laut API. |
| `currentMonthsIncome` |  | Monatsertragszaehler laut API. |
| `cumulativeIncome` |  | Gesamtertragszaehler laut API. |
| `saveStandardCoal` |  | Umweltzaehler laut API. |
| `emissionReductionCO2` |  | CO2-Reduktionszaehler laut API. |
| `protectTrees` |  | Baum-Schutz-Zaehler laut API. |
| `inverterTotal` |  | Anzahl zugeordneter Wechselrichter. |
| `inOnCount` |  | Anzahl online gemeldeter Wechselrichter. |

#### Collector-Datenpunkte

Collector-Datenpunkte werden unter `stations.<stationId>.inverters.<inverterId>` angelegt. Sie werden auch dann angelegt, wenn der separate Inverterdaten-Endpunkt keine Zeilen liefert.

| Datenpunkt | Einheit | Beschreibung |
| --- | --- | --- |
| `collectorId` |  | Collector-ID |
| `collectorName` |  | Collector-Name |
| `inverterId` |  | Wechselrichter-ID |
| `inverterName` |  | Wechselrichtername |
| `communicationStatus` |  | Kommunikationsstatus laut API |
| `onlineStatus` |  | Online-Status laut API |
| `networkStatus` |  | Numerischer Netzwerkstatus |
| `inPower` | W | Eingangs-/Momentanleistung aus der Collector-Liste |
| `ipAddress` |  | Von der API gemeldete IP-Adresse |
| `onlineTime` |  | Letzter Online-Zeitstempel |
| `exhibitionTime` |  | Letzter von der API angezeigter Datenzeitstempel |
| `collectorType` |  | Collector-Typ |
| `equipmentType` |  | Geraetetyp |
| `modelReplace` |  | Modellkennung |

#### Wechselrichter-Datenpunkte

| Datenpunkt | Einheit | Beschreibung |
| --- | --- | --- |
| `acPower` | W | AC-Ausgangsleistung |
| `acVoltage` | V | AC-Spannung |
| `acFrequency` | Hz | AC-Frequenz |
| `acElectric` | A | AC-Strom |
| `pv1Power` | W | Leistung PV-Eingang 1 |
| `pv2Power` | W | Leistung PV-Eingang 2 |
| `pv1Voltage` | V | Spannung PV-Eingang 1 |
| `pv2Voltage` | V | Spannung PV-Eingang 2 |
| `pv1Electric` | A | Strom PV-Eingang 1 |
| `pv2Electric` | A | Strom PV-Eingang 2 |
| `inPower` | W | Von der API gemeldete Eingangsleistung |
| `temperature` | °C | Wechselrichtertemperatur |
| `batteryVoltage` | V | Batteriespannung, falls vom Geraet gemeldet |
| `batteryCurrent` | A | Batteriestrom, falls vom Geraet gemeldet |
| `batteryPower` | W | Batterieleistung, falls vom Geraet gemeldet |
| `loadPower` | W | Lastleistung, falls vom Geraet gemeldet |
| `controllerTemperature` | °C | Controller-Temperatur, falls vom Geraet gemeldet |

Nicht jedes Absaar-Geraet liefert jeden Wert. Fehlende Werte werden nicht ueberschrieben, bis die API einen gueltigen numerischen Wert liefert.

### Abfrageverhalten

Das Standardintervall liegt bei 120 Sekunden. Das Intervall sollte bewusst konservativ bleiben, um unnoetig viele Cloud-Abfragen zu vermeiden.

### Fehlersuche

1. `absaar.0.info.connection` pruefen.
2. `absaar.0.info.lastError` pruefen.
3. Zugangsdaten in der Absaar EMS App gegenpruefen.
4. Beim Testen das Poll-Intervall bei 120 Sekunden oder hoeher lassen.
5. Rohdaten-JSON nur temporaer aktivieren, weil die States je nach API-Antwort gross werden koennen.

### Versionshistorie

#### 0.1.3

- Paket-Metadaten fuer ioBroker Repository-Pruefungen aktualisiert.
- Minimale Node.js-Version auf Node.js 20 angehoben.
- Repository, Autor, Lizenzinformationen, Tier und erweiterte Uebersetzungen ergaenzt.

#### 0.1.2

- Dokumentation fuer eine moegliche Veroeffentlichung bereinigt.
- Versionshistorie ergaenzt.

#### 0.1.1

- Collector-Datenpunkte werden auch dann angelegt, wenn keine detaillierten Inverterdaten zurueckgegeben werden.
- Weitere Stationswerte wie aktuelle Leistung, Monatserzeugung und Umweltzaehler ergaenzt.
- Deutsche und englische Dokumentation erweitert.

#### 0.1.0

- Erste Cloud-Polling-Version.
- Anmeldung, Stationsabfrage, Collector-Abfrage und Inverterdaten-Abfrage ergaenzt.
- Materialize-Admin-Konfiguration ergaenzt.

## Changelog

### **WORK IN PROGRESS**
- (ioBroker-Bot) Adapter requires admin >= 7.8.23 now.

