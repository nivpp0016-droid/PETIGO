#include "system_state.h"

const char* getStateName(BoxState state) {

    switch (state) {

        case BoxState::LOCKED:
            return "LOCKED";

        case BoxState::UNLOCKED:
            return "UNLOCKED";

        case BoxState::DOOR_OPEN:
            return "DOOR OPEN";

        case BoxState::PARCEL_DETECTED:
            return "PARCEL DETECTED";

        case BoxState::DELIVERY_COMPLETE:
            return "DELIVERY COMPLETE";

        case BoxState::ALARM:
            return "ALARM";

        case BoxState::OFFLINE:
            return "OFFLINE";

        default:
            return "UNKNOWN";
    }
}