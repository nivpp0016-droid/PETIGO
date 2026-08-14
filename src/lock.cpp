#include "lock.h"

LockController::LockController(uint8_t relayPin) {
    _relayPin = relayPin;
    _locked = true;
}

void LockController::begin() {
    pinMode(_relayPin, OUTPUT);

    // Start with the lock safely locked
    digitalWrite(_relayPin, LOW);
}

void LockController::unlock() {
    digitalWrite(_relayPin, HIGH);
    _locked = false;

    Serial.println("LOCK: UNLOCKED");
}

void LockController::lock() {
    digitalWrite(_relayPin, LOW);
    _locked = true;

    Serial.println("LOCK: LOCKED");
}

bool LockController::isLocked() {
    return _locked;
}