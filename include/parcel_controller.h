#ifndef PARCEL_CONTROLLER_H
#define PARCEL_CONTROLLER_H

#include <Arduino.h>

enum class ParcelState {
    IDLE_LOCKED,
    OTP_ENTRY,
    VERIFYING,
    UNLOCKED,
    DOOR_OPEN,
    PARCEL_DETECTED,
    DELIVERY_COMPLETE,
    ALARM
};

const char* getParcelStateName(ParcelState state);

class ParcelController {
public:
    ParcelController();

    void begin();
    ParcelState getState() const;
    void setState(ParcelState newState);

    void startOtpEntry();
    void cancelOtpEntry();
    void unlock();
    void doorOpened();
    void doorClosed();
    void parcelDetected();
    void triggerAlarm();
    void resetToIdle();

private:
    ParcelState _state;
};

#endif