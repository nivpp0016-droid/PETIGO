#include "parcel_controller.h"

const char* getParcelStateName(ParcelState state) {
    switch (state) {
        case ParcelState::IDLE_LOCKED: return "IDLE_LOCKED";
        case ParcelState::OTP_ENTRY: return "OTP_ENTRY";
        case ParcelState::VERIFYING: return "VERIFYING";
        case ParcelState::UNLOCKED: return "UNLOCKED";
        case ParcelState::DOOR_OPEN: return "DOOR_OPEN";
        case ParcelState::PARCEL_DETECTED: return "PARCEL_DETECTED";
        case ParcelState::DELIVERY_COMPLETE: return "DELIVERY_COMPLETE";
        case ParcelState::ALARM: return "ALARM";
        default: return "UNKNOWN";
    }
}

ParcelController::ParcelController()
    : _state(ParcelState::IDLE_LOCKED) {
}

void ParcelController::begin() {
    _state = ParcelState::IDLE_LOCKED;
}

ParcelState ParcelController::getState() const {
    return _state;
}

void ParcelController::setState(ParcelState newState) {
    _state = newState;
    Serial.printf("[STATE] -> %s\n", getParcelStateName(_state));
}

void ParcelController::startOtpEntry() {
    if (_state == ParcelState::IDLE_LOCKED) {
        setState(ParcelState::OTP_ENTRY);
    }
}

void ParcelController::cancelOtpEntry() {
    if (_state == ParcelState::OTP_ENTRY || _state == ParcelState::VERIFYING) {
        setState(ParcelState::IDLE_LOCKED);
    }
}

void ParcelController::unlock() {
    setState(ParcelState::UNLOCKED);
}

void ParcelController::doorOpened() {
    if (_state == ParcelState::UNLOCKED) {
        setState(ParcelState::DOOR_OPEN);
    } else if (_state == ParcelState::IDLE_LOCKED) {
        // Door opened without authorization!
        triggerAlarm();
    }
}

void ParcelController::doorClosed() {
    if (_state == ParcelState::DOOR_OPEN || _state == ParcelState::PARCEL_DETECTED) {
        setState(ParcelState::DELIVERY_COMPLETE);
    } else if (_state == ParcelState::ALARM) {
        setState(ParcelState::IDLE_LOCKED);
    }
}

void ParcelController::parcelDetected() {
    if (_state == ParcelState::DOOR_OPEN) {
        setState(ParcelState::PARCEL_DETECTED);
    }
}

void ParcelController::triggerAlarm() {
    setState(ParcelState::ALARM);
}

void ParcelController::resetToIdle() {
    setState(ParcelState::IDLE_LOCKED);
}