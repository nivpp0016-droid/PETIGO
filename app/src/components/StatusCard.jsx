function StatusCard({
  icon: Icon,
  label,
  value,
  status = "neutral"
}) {
  return (
    <div className={`status-card-simple is-${status}`}>
      <div className="status-card-simple-top">
        <div className="status-card-simple-icon">
          <Icon size={22} />
        </div>
      </div>

      <div>
        <span className="status-card-simple-label">{label}</span>
        <strong className="status-card-simple-value">{value}</strong>
      </div>
    </div>
  );
}

export default StatusCard;