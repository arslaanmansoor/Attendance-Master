import unittest
import urllib.request
from pathlib import Path


class DashboardFeaturesTest(unittest.TestCase):
    def test_homepage_is_served(self):
        with urllib.request.urlopen("http://127.0.0.1:8000/index.html", timeout=5) as response:
            self.assertEqual(response.status, 200)

    def test_homepage_contains_required_dashboard_features(self):
        html = Path("index.html").read_text(encoding="utf-8")

        required_markers = [
            "data-theme-toggle",
            "data-notification-toggle",
            "data-company-switcher",
            "data-table-search",
            "data-export-csv",
            "data-export-excel",
            "data-bulk-actions",
            "toast-container",
            'data-range="7d"',
            "Department pulse",
            "Leave requests",
            "Upcoming holidays",
            "data-add-employee",
            "employeeTable",
            "data-employee-search",
            "employeeForm",
            "attendanceTracker",
            "leaveRequestForm",
            "payrollSummary",
        ]

        missing = [marker for marker in required_markers if marker not in html]
        self.assertFalse(missing, f"Missing dashboard features: {missing}")


if __name__ == "__main__":
    unittest.main()
