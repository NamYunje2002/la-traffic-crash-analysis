export const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px",
  },
  tabContainer: {
    display: "flex",
    gap: "16px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "16px",
  },
  tabButton: {
    padding: "8px 16px",
    border: "none",
    background: "none",
    cursor: "pointer",
  },
  activeTab: {
    borderBottom: "2px solid #3b82f6",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "bold",
  },
  mapContainer: {
    width: "100%",
    height: "600px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mapText: {
    textAlign: "center",
    color: "#6b7280",
    width: "100%",
    height: "100%",
  },
  mapContainerStyle: {
    width: "100%",
    height: "100%"
  },
  chartContainer: {
    height: "320px",
  },
  dateLabel: {
    display: "flex",
    flexDirection: "column",
    fontSize: "1rem",
    marginBottom: "8px",
  },
  dateInput: {
    marginTop: "8px",
    padding: "8px",
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  selectedDateText: {
    fontSize: "1rem",
    color: "#6b7280",
  },
  analyzeButton: {
    marginTop: "10px",
    padding: "8px 12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};