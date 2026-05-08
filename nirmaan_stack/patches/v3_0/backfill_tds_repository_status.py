import frappe


def execute():
	rows = frappe.db.sql(
		"""SELECT name FROM `tabTDS Repository` WHERE status IS NULL OR status = ''"""
	)
	for (name,) in rows:
		frappe.db.set_value(
			"TDS Repository", name, "status", "Not Verified", update_modified=False
		)
	if rows:
		frappe.db.commit()
