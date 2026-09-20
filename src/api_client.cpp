#include "api_client.h"
#include <HTTPClient.h>
#include <WiFi.h>

ApiClient::ApiClient() {
}

void ApiClient::begin(const char* serverUrl, const char* deviceToken) {
    _serverUrl = serverUrl;
    _deviceToken = deviceToken;
}

bool ApiClient::sendStatus(
    const char* doorStatus,
    const char* lockStatus,
    const char* parcelStatus
) {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }

    HTTPClient http;
    http.setTimeout(2500);

    String url = _serverUrl + "/api/device/status";
    if (!http.begin(url)) return false;

    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-token", _deviceToken);

    String body = "{";
    body += "\"doorStatus\":\"" + String(doorStatus) + "\",";
    body += "\"lockStatus\":\"" + String(lockStatus) + "\",";
    body += "\"parcelStatus\":\"" + String(parcelStatus) + "\"";
    body += "}";

    int httpCode = http.POST(body);
    bool ok = (httpCode == 200);

    if (ok) {
        Serial.println("[API] Status sent successfully.");
    } else {
        Serial.printf("[API] Failed to send status, code: %d\n", httpCode);
    }

    http.end();
    return ok;
}

bool ApiClient::verifyOtp(
    const char* boxCode,
    const char* otp,
    bool& accessGranted,
    String& message
) {
    accessGranted = false;
    message = "";

    if (WiFi.status() != WL_CONNECTED) {
        message = "No WiFi";
        return false;
    }

    HTTPClient http;
    http.setTimeout(3000);

    String url = _serverUrl + "/api/otp/verify";
    if (!http.begin(url)) {
        message = "Conn Error";
        return false;
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-token", _deviceToken);

    String body = "{";
    body += "\"boxCode\":\"" + String(boxCode) + "\",";
    body += "\"otp\":\"" + String(otp) + "\"";
    body += "}";

    Serial.printf("[API] Verifying OTP: %s\n", otp);
    int httpCode = http.POST(body);
    String response = http.getString();
    http.end();

    Serial.printf("[API] OTP verify response (%d): %s\n", httpCode, response.c_str());

    if (httpCode == 200 && response.indexOf("\"accessGranted\":true") != -1) {
        accessGranted = true;
        message = "Verified";
        return true;
    }

    if (response.indexOf("Invalid OTP") != -1) {
        message = "Invalid OTP";
    } else if (response.indexOf("expired") != -1) {
        message = "OTP Expired";
    } else if (response.indexOf("No active OTP") != -1) {
        message = "No Active OTP";
    } else {
        message = "Access Denied";
    }

    return false;
}

bool ApiClient::pollCommand(int& commandId, String& command) {
    commandId = 0;
    command = "";

    if (WiFi.status() != WL_CONNECTED) return false;

    HTTPClient http;
    http.setTimeout(2000);

    String url = _serverUrl + "/api/device/commands";
    if (!http.begin(url)) return false;

    http.addHeader("x-device-token", _deviceToken);

    int httpCode = http.GET();
    if (httpCode == 200) {
        String response = http.getString();
        http.end();

        if (response.indexOf("\"command\":\"UNLOCK\"") != -1) {
            command = "UNLOCK";

            // Extract commandId
            int idIdx = response.indexOf("\"commandId\":");
            if (idIdx != -1) {
                int start = idIdx + 12;
                int endComma = response.indexOf(',', start);
                int endBrace = response.indexOf('}', start);
                int end = -1;
                if (endComma != -1 && endBrace != -1) {
                    end = (endComma < endBrace) ? endComma : endBrace;
                } else if (endComma != -1) {
                    end = endComma;
                } else {
                    end = endBrace;
                }

                if (end != -1) {
                    commandId = response.substring(start, end).toInt();
                }
            }
            return true;
        }
    } else {
        http.end();
    }

    return false;
}

bool ApiClient::acknowledgeCommand(int commandId) {
    if (WiFi.status() != WL_CONNECTED || commandId <= 0) return false;

    HTTPClient http;
    http.setTimeout(2000);

    String url = _serverUrl + "/api/device/commands/" + String(commandId) + "/ack";
    if (!http.begin(url)) return false;

    http.addHeader("x-device-token", _deviceToken);

    int httpCode = http.POST("");
    http.end();
    return httpCode == 200;
}

bool ApiClient::sendHeartbeat() {
    if (WiFi.status() != WL_CONNECTED) return false;

    HTTPClient http;
    http.setTimeout(2000);

    String url = _serverUrl + "/api/device/heartbeat";
    if (!http.begin(url)) return false;

    http.addHeader("x-device-token", _deviceToken);

    int httpCode = http.GET();
    http.end();
    return httpCode == 200;
}