#include "keypad_manager.h"
#include "config.h"

static char keys[KEYPAD_ROWS][KEYPAD_COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}
};

static byte rowPins[KEYPAD_ROWS] = {KEYPAD_ROW_PINS[0], KEYPAD_ROW_PINS[1], KEYPAD_ROW_PINS[2], KEYPAD_ROW_PINS[3]};
static byte colPins[KEYPAD_COLS] = {KEYPAD_COL_PINS[0], KEYPAD_COL_PINS[1], KEYPAD_COL_PINS[2], KEYPAD_COL_PINS[3]};

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