#ifndef SYSTEM_STATE_H
#define SYSTEM_STATE_H

enum class BoxState {
    LOCKED,
    UNLOCKED,
    DOOR_OPEN,
    PARCEL_DETECTED,
    DELIVERY_COMPLETE,
    ALARM,
    OFFLINE
};

const char* getStateName(BoxState state);

#endif