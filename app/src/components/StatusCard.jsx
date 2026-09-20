function StatusCard({
  icon: Icon,
  label,
  value,
  status = "neutral",
  description
}) {
  return (
    <div className={`status-card status-${status}`}>
      <div className="status-card-top">
        <div className="status-icon">
          <Icon size={20} />
        </div>

        <span className="status-indicator" />
      </div>

      <div className="status-card-content">
        <span className="status-label">
          {label}
        </span>

        <strong className="status-value">
          {value}
        </strong>

        {description && (
          <span className="status-description">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatusCard;