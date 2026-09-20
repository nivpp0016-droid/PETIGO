#ifndef BUZZER_H
#define BUZZER_H

#include <Arduino.h>

class Buzzer {
public:
    explicit Buzzer(uint8_t pin);

    void begin();
    void beep(unsigned int durationMs = 50);
    void success();
    void error();
    void alarm();

private:
    uint8_t _pin;
};

#endif