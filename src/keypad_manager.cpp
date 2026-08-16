#include "keypad_manager.h"

char keys[KEYPAD_ROWS][KEYPAD_COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}
};

// Temporary GPIO assignments.
// We will finalize these after checking your physical keypad wiring.
byte rowPins[KEYPAD_ROWS] = {32, 33, 25, 27};
byte colPins[KEYPAD_COLS] = {14, 16, 17, 18};

KeypadManager::KeypadManager()
    : _keypad(
        makeKeymap(keys),
        rowPins,
        colPins,
        KEYPAD_ROWS,
        KEYPAD_COLS
    ) {
}

char KeypadManager::getKey() {
    return _keypad.getKey();
}

bool KeypadManager::isKeyPressed() {
    return _keypad.getKey() != NO_KEY;
}