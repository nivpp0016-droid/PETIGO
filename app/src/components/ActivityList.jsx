import {
  CheckCircle2,
  Lock,
  KeyRound,
  ShieldAlert,
  Package,
  Clock
} from "lucide-react";

const icons = {
  delivery: Package,
  otp: KeyRound,
  security: ShieldAlert,
  lock: Lock,
  success: CheckCircle2
};

function ActivityList({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="activity-empty">
        <div className="activity-empty-icon">
          <Clock size={22} />
        </div>

        <div>
          <strong>No recent activity</strong>
          <span>
            Activity from your parcel box will
            appear here.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {activities.map((activity, index) => {
        const Icon =
          icons[activity.type] || CheckCircle2;

        return (
          <div
            className="activity-item"
            key={`${activity.type || 'act'}-${activity.id}-${index}`}
          >
            <div
              className={`activity-icon activity-${activity.type || "success"}`}
            >
              <Icon size={18} />
            </div>

            <div className="activity-content">
              <strong>
                {activity.title}
              </strong>

              <span>
                {activity.description}
              </span>
            </div>

            <time>
              {activity.created_at
                ? new Date(
                    activity.created_at
                  ).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "Just now"}
            </time>
          </div>
        );
      })}
    </div>
  );
}

export default ActivityList;