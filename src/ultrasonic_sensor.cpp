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
      _lastMeasureTime(0),
      _consecutiveDetections(0) {
}

void UltrasonicSensor::begin() {
    pinMode(_trigPin, OUTPUT);
    pinMode(_echoPin, INPUT);
    digitalWrite(_trigPin, LOW);
}

float UltrasonicSensor::measureRawDistance() {
    // Send 10us trigger pulse
    digitalWrite(_trigPin, LOW);
    delayMicroseconds(4);
    digitalWrite(_trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trigPin, LOW);

    unsigned long duration = pulseIn(_echoPin, HIGH, 30000UL);
    if (duration == 0) {
        duration = pulseInLong(_echoPin, HIGH, 30000UL);
    }

    if (duration == 0 || duration >= 30000UL) {
        return -1.0f;
    }

    // Sound speed = 0.0343 cm/us
    float distance = (duration * 0.0343f) / 2.0f;
    return distance;
}

void UltrasonicSensor::update() {
    unsigned long now = millis();
    if (now - _lastMeasureTime < 80) {
        return; // Ensure at least 80ms between ultrasonic chirps to prevent echoes
    }
    _lastMeasureTime = now;

    float rawDist = measureRawDistance();

    // Low-pass filter for smooth, rock-solid readings
    if (rawDist > 1.0f && rawDist < 400.0f) {
        if (_lastDistance <= 0.0f) {
            _lastDistance = rawDist;
        } else {
            _lastDistance = (_lastDistance * 0.6f) + (rawDist * 0.4f);
        }
    } else {
        _lastDistance = rawDist;
    }

    if (_lastDistance > 1.0f && _lastDistance <= _thresholdCm) {
        if (_consecutiveDetections < REQUIRED_CONSECUTIVE_SAMPLES) {
            _consecutiveDetections++;
        }
    } else {
        if (_consecutiveDetections > 0) {
            _consecutiveDetections--;
        }
    }
}

bool UltrasonicSensor::isParcelDetected() const {
    return _consecutiveDetections >= REQUIRED_CONSECUTIVE_SAMPLES;
}