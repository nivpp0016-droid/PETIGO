#ifndef LOCK_H
#define LOCK_H

#include <Arduino.h>

class LockController {
public:
    LockController(uint8_t relayPin);

    void begin();
    void unlock();
    void lock();
    bool isLocked();

private:
    uint8_t _relayPin;
    bool _locked;
};

#endif