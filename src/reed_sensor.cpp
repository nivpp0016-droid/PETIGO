#include "reed_sensor.h"

ReedSensor::ReedSensor(uint8_t pin, bool activeLow)
    : _pin(pin),
      _activeLow(activeLow),
      _lastRawState(HIGH),
      _debouncedState(HIGH),
      _stateChanged(false),
      _lastDebounceTime(0) {
}

void ReedSensor::begin() {
    pinMode(_pin, INPUT_PULLUP);
    int raw = digitalRead(_pin);
    _lastRawState = raw;
    _debouncedState = raw;
    _stateChanged = false;
}

void ReedSensor::update() {
    int raw = digitalRead(_pin);
    _stateChanged = false;

    if (raw != _lastRawState) {
        _lastDebounceTime = millis();
        _lastRawState = raw;
    }

    if ((millis() - _lastDebounceTime) > DEBOUNCE_DELAY_MS) {
        if (raw != _debouncedState) {
            _debouncedState = raw;
            _stateChanged = true;
        }
    }
}

bool ReedSensor::isDoorOpen() {
    // When activeLow is true (standard magnetic switch to GND):
    // Contact closed (Magnet near / Door closed) -> connects to GND (LOW)
    // Contact open (Magnet away / Door open) -> pulled up by resistor (HIGH)
    if (_activeLow) {
        return _debouncedState == HIGH;
    } else {
        return _debouncedState == LOW;
    }
}

bool ReedSensor::hasChanged() {
    return _stateChanged;
}