#include "ultrasonic_sensor.h"

UltrasonicSensor::UltrasonicSensor(
    uint8_t trigPin,
    uint8_t echoPin,
    float detectionThresholdCm
)
    : _trigPin(trigPin),
      _echoPin(echoPin),
      _thresholdCm(detectionThresholdCm),
      _lastDistance(-1.0f),
      _consecutiveDetections(0) {
}

void UltrasonicSensor::begin() {
    pinMode(_trigPin, OUTPUT);
    pinMode(_echoPin, INPUT);
    digitalWrite(_trigPin, LOW);
}

float UltrasonicSensor::getDistanceCm() {
    // 10us trigger pulse
    digitalWrite(_trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(_trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trigPin, LOW);

    // Timeout after 25,000 us (~4.3 meters max)
    unsigned long duration = pulseIn(_echoPin, HIGH, 25000UL);

    if (duration == 0) {
        return -1.0f; // No echo received
    }

    // Sound speed = 0.0343 cm/us
    float distance = (duration * 0.0343f) / 2.0f;
    _lastDistance = distance;
    return distance;
}

void UltrasonicSensor::update() {
    float dist = getDistanceCm();

    if (dist > 1.0f && dist <= _thresholdCm) {
        if (_consecutiveDetections < REQUIRED_CONSECUTIVE_SAMPLES) {
            _consecutiveDetections++;
        }
    } else if (dist > _thresholdCm) {
        if (_consecutiveDetections > 0) {
            _consecutiveDetections--;
        }
    }
}

bool UltrasonicSensor::isParcelDetected() {
    return _consecutiveDetections >= REQUIRED_CONSECUTIVE_SAMPLES;
}