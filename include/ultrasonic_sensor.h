#ifndef ULTRASONIC_SENSOR_H
#define ULTRASONIC_SENSOR_H

#include <Arduino.h>

class UltrasonicSensor {
public:
    UltrasonicSensor(uint8_t trigPin, uint8_t echoPin, float detectionThresholdCm = 25.0f);

    void begin();
    float getDistanceCm();
    bool isParcelDetected();
    void update();

private:
    uint8_t _trigPin;
    uint8_t _echoPin;
    float _thresholdCm;
    float _lastDistance;
    int _consecutiveDetections;
    static const int REQUIRED_CONSECUTIVE_SAMPLES = 3;
};

#endif