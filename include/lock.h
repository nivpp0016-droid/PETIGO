#ifndef LOCK_H
#define LOCK_H

#include <Arduino.h>

class LockController {
public:
    explicit LockController(uint8_t relayPin, bool activeLow = false);

    void begin();
    void update();
    void unlock(unsigned long durationMs = 5000);
    void lock();
    bool isLocked() const;

private:
    uint8_t _relayPin;
    bool _activeLow;
    bool _isLocked;
    unsigned long _unlockStartTime;
    unsigned long _unlockDuration;
};

#endif