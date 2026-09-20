#include "lock.h"

LockController::LockController(uint8_t relayPin, bool activeLow)
    : _relayPin(relayPin),
      _activeLow(activeLow),
      _isLocked(true),
      _unlockStartTime(0),
      _unlockDuration(0) {
}

void LockController::begin() {
    pinMode(_relayPin, OUTPUT);
    lock(); // Initialize safely locked
}

void LockController::unlock(unsigned long durationMs) {
    _isLocked = false;
    _unlockStartTime = millis();
    _unlockDuration = durationMs;

    // Energize relay
    digitalWrite(_relayPin, _activeLow ? LOW : HIGH);
    Serial.println("[LOCK] UNLOCKED (Solenoid energized)");
}

void LockController::lock() {
    _isLocked = true;
    _unlockDuration = 0;

    // De-energize relay
    digitalWrite(_relayPin, _activeLow ? HIGH : LOW);
    Serial.println("[LOCK] LOCKED (Solenoid de-energized)");
}

void LockController::update() {
    if (!_isLocked && _unlockDuration > 0) {
        if (millis() - _unlockStartTime >= _unlockDuration) {
            Serial.println("[LOCK] Safety auto-lock timeout reached");
            lock();
        }
    }
}

bool LockController::isLocked() const {
    return _isLocked;
}