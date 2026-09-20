#ifndef KEYPAD_MANAGER_H
#define KEYPAD_MANAGER_H

#include <Arduino.h>
#include <Keypad.h>

class KeypadManager {
public:
    KeypadManager();

    char getKey();

private:
    Keypad _keypad;
};

#endif