#ifndef REED_SENSOR_H
#define REED_SENSOR_H

#include <Arduino.h>

class ReedSensor {
public:
    explicit ReedSensor(uint8_t pin, bool activeLow = true);

    void begin();
    void update();
    bool isDoorOpen();
    bool hasChanged();

private:
    uint8_t _pin;
    bool _activeLow;
    bool _lastRawState;
    bool _debouncedState;
    bool _stateChanged;
    unsigned long _lastDebounceTime;
    static const unsigned long DEBOUNCE_DELAY_MS = 50;
};

#endif