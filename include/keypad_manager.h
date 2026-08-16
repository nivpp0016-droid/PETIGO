#ifndef KEYPAD_MANAGER_H
#define KEYPAD_MANAGER_H

#include <Arduino.h>
#include <Keypad.h>

#define KEYPAD_ROWS 4
#define KEYPAD_COLS 4

class KeypadManager {
public:
    KeypadManager();

    char getKey();
    bool isKeyPressed();

private:
    Keypad _keypad;
};

#endif