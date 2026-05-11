import frappe
from frappe.utils import flt

from nirmaan_stack.nirmaan_stack.doctype.projects.projects import CEO_HOLD_SYSTEM_USER

EXCLUDED_STATUSES = ("CEO Hold", "Completed")


def update_projects_cashflow_hold():
	"""
	Daily cron: place any project whose cashflow gap exceeds its
	cashflow_gap_limited on CEO Hold. Hold-only — never auto-releases.

	Uses frappe.db.set_value(..., update_modified=False) to skip the
	`modified` timestamp bump and the validate() hook (so Administrator
	can write CEO Hold without tripping the manual-only check).
	"""
	projects = frappe.get_all(
		"Projects",
		filters=[
			["status", "not in", EXCLUDED_STATUSES],
			["cashflow_gap_limited", ">", 0],
		],
		fields=["name", "cashflow_gap_limited"],
	)

	for p in projects:
		gap = _compute_cashflow_gap(p.name)
		if gap <= flt(p.cashflow_gap_limited):
			continue

		frappe.db.set_value(
			"Projects",
			p.name,
			{
				"status": "CEO Hold",
				"ceo_hold_by": CEO_HOLD_SYSTEM_USER,
			},
			update_modified=False,
		)
		frappe.logger().info(
			"[cashflow-hold] %s: gap=%.2f > limit=%.2f → CEO Hold"
			% (p.name, gap, flt(p.cashflow_gap_limited))
		)

	frappe.db.commit()


def _compute_cashflow_gap(project_id: str) -> float:
	"""
	Mirror of the frontend formula in projects.tsx (lines 462-477):
	    gap = (paid_payments + all_expenses + liabilities) - all_inflows
	    liabilities = Σ po_amount_delivered − Σ min(amount_paid, po_amount_delivered)
	"""
	paid_payments = frappe.get_all(
		"Project Payments",
		filters=[["project", "=", project_id], ["status", "=", "Paid"]],
		fields=["amount"],
	)
	expenses = frappe.get_all(
		"Project Expenses",
		filters=[["projects", "=", project_id]],  # 'projects' (plural) is correct
		fields=["amount"],
	)
	outflow = sum(flt(p.amount) for p in paid_payments) + sum(flt(e.amount) for e in expenses)

	inflows = frappe.get_all(
		"Project Inflows",
		filters=[["project", "=", project_id]],
		fields=["amount"],
	)
	inflow = sum(flt(i.amount) for i in inflows)

	pos = frappe.get_all(
		"Procurement Orders",
		filters=[["project", "=", project_id]],
		fields=["po_amount_delivered", "amount_paid"],
	)
	payable = sum(flt(po.po_amount_delivered) for po in pos)
	paid_against_delivered = sum(
		min(flt(po.amount_paid), flt(po.po_amount_delivered)) for po in pos
	)
	liabilities = payable - paid_against_delivered

	return outflow + liabilities - inflow
