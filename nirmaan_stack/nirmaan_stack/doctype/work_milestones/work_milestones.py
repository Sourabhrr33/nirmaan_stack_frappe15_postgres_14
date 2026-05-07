# Copyright (c) 2025, Nirmaan (Stratos Infra Technologies Pvt. Ltd.) and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class WorkMilestones(Document):
	def validate(self):
		self._validate_dependent_milestones()
		self._validate_critical_po_dependencies()

	def _validate_dependent_milestones(self):
		seen = set()
		for row in self.get("dependent_milestones") or []:
			if not row.dependent_milestone:
				continue
			if row.dependent_milestone == self.name:
				frappe.throw(
					f"A milestone cannot depend on itself ({self.name}).",
					title="Invalid Dependency",
				)
			if row.dependent_milestone in seen:
				frappe.throw(
					f"Duplicate dependency: {row.dependent_milestone}.",
					title="Duplicate Dependency",
				)
			seen.add(row.dependent_milestone)

	def _validate_critical_po_dependencies(self):
		seen = set()
		for row in self.get("critical_po_dependencies") or []:
			if not row.critical_po_item:
				continue
			if row.critical_po_item in seen:
				frappe.throw(
					f"Duplicate Critical PO Item: {row.critical_po_item}.",
					title="Duplicate Critical PO Dependency",
				)
			seen.add(row.critical_po_item)

			pct = row.delivery_percentage or 0
			if pct < 0 or pct > 100:
				frappe.throw(
					f"Delivery % for {row.critical_po_item} must be between 0 and 100 (got {pct}).",
					title="Invalid Delivery %",
				)
