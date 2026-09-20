#include "buzzer.h"

Buzzer::Buzzer(uint8_t pin)
    : _pin(pin) {
}

void Buzzer::begin() {
    pinMode(_pin, OUTPUT);
    digitalWrite(_pin, LOW);
}

void Buzzer::beep(unsigned int durationMs) {
    digitalWrite(_pin, HIGH);
    delay(durationMs);
    digitalWrite(_pin, LOW);
}

void Buzzer::success() {
    beep(60);
    delay(40);
    beep(100);
}

void Buzzer::error() {
    beep(150);
    delay(80);
    beep(150);
}

void Buzzer::alarm() {
    for (int i = 0; i < 3; i++) {
        beep(120);
        delay(60);
    }
}