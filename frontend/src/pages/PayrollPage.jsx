
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Banknote,
  Plus,
  ReceiptText,
  Trash2,
  X,
} from 'lucide-react';

import { api } from '../lib/api';

// ==========================================
// PAYROLL PAGE
// ==========================================

export default function PayrollPage() {
  // ==========================================
  // STATE
  // ==========================================

  const [rows, setRows] = useState([]);
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(null);

  const [modal, setModal] = useState('');
  const [error, setError] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  // ==========================================
  // SHARED SAVE HANDLER
  // ==========================================

  const handleSave = async (event, callback) => {
    event.preventDefault();

    // Prevent multiple submissions
    if (savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    setError('');

    // Get form values before asynchronous processing
    const values = Object.fromEntries(
      new FormData(event.currentTarget)
    );

    try {
      await callback(values);
    } catch (err) {
      setError(err.message || 'Failed to save data.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // ==========================================
  // FETCH DATA
  // ==========================================

  const load = useCallback(async () => {
    try {
      const [payrolls, persons] = await Promise.all([
        api('/payrolls?limit=100'),
        api('/people?limit=100'),
      ]);

      setRows(payrolls.data);
      setPeople(persons.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ==========================================
  // GET PERSONNEL NAME
  // ==========================================

  const getPersonName = (id) => {
    return (
      people.find((person) => person.id === id)?.full_name ||
      'Unknown personnel'
    );
  };

  // ==========================================
  // PAYROLL DETAILS
  // ==========================================

  const getDetails = async (id) => {
    try {
      const response = await api(`/payrolls/${id}/details`);
      setSelected(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // CREATE PAYROLL
  // ==========================================

  const createPayroll = async (values) => {
    await api('/payrolls', {
      method: 'POST',
      body: JSON.stringify({
        ...values,
        total_earnings: 0,
        total_deductions: 0,
      }),
    });

    setModal('');
    await load();
  };

  // ==========================================
  // ADD SALARY COMPONENT
  // ==========================================

  const addItem = async (values) => {
    await api(`/payrolls/${selected.id}/items`, {
      method: 'POST',
      body: JSON.stringify(values),
    });

    setModal('');
    await getDetails(selected.id);
    await load();
  };

  // ==========================================
  // RECORD PAYMENT
  // ==========================================

  const addPayment = async (values) => {
    await api(`/payrolls/${selected.id}/payments`, {
      method: 'POST',
      body: JSON.stringify(values),
    });

    setModal('');
    await getDetails(selected.id);
  };

  // ==========================================
  // DELETE SALARY COMPONENT
  // ==========================================

  const removeItem = async (id) => {
    try {
      await api(`/payrolls/${selected.id}/items/${id}`, {
        method: 'DELETE',
      });

      await getDetails(selected.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // UPDATE PAYROLL STATUS
  // ==========================================

  const updateStatus = async (status) => {
    try {
      await api(`/payrolls/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      await getDetails(selected.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section className="page">

      {/* Page Header */}
      <header>
        <div>
          <p className="eyebrow">Compensation</p>
          <h1>Payroll</h1>
        </div>

        <button
          className="primary"
          type="button"
          onClick={() => {
            setError('');
            setModal('payroll');
          }}
        >
          <Plus />
          New payroll
        </button>
      </header>

      {/* Error Message */}
      {error && (
        <div className="error">
          {error}

          <button
            type="button"
            onClick={() => setError('')}
          >
            <X />
          </button>
        </div>
      )}

      {/* Payroll Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Personnel</th>
              <th>Period</th>
              <th>Earnings</th>
              <th>Deductions</th>
              <th>Net salary</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="clickable"
                onClick={() => getDetails(row.id)}
              >
                <td>{getPersonName(row.person_id)}</td>
                <td>{row.payroll_period}</td>
                <td>{money(row.total_earnings)}</td>
                <td>{money(row.total_deductions)}</td>

                <td>
                  <strong>{money(row.net_salary)}</strong>
                </td>

                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!rows.length && (
          <div className="state">
            No payroll records.
          </div>
        )}
      </div>

      {/* Payroll Detail Drawer */}
      {selected && (
        <div className="detail-drawer">

          <header>
            <div>
              <p className="eyebrow">
                {selected.payroll_period}
              </p>

              <h2>
                {getPersonName(selected.person_id)}
              </h2>
            </div>

            <button
              type="button"
              aria-label="Close payroll details"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
          </header>

          {/* Payroll Status */}
          <label className="payroll-status">
            <span>Payroll status</span>

            <select
              aria-label="Payroll status"
              value={selected.status}
              onChange={(event) =>
                updateStatus(event.target.value)
              }
            >
              {['Draft', 'Approved', 'Paid', 'Cancelled'].map(
                (status) => (
                  <option key={status}>{status}</option>
                )
              )}
            </select>
          </label>

          {/* Net Salary */}
          <div className="detail-total">
            <span>Net salary</span>
            <strong>{money(selected.net_salary)}</strong>
          </div>

          {/* Detail Actions */}
          <div className="detail-actions">
            <button
              className="primary"
              type="button"
              onClick={() => {
                setError('');
                setModal('item');
              }}
            >
              <ReceiptText />
              Add component
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setModal('payment');
              }}
            >
              <Banknote />
              Record payment
            </button>
          </div>

          {/* Salary Components */}
          <h3>Salary components</h3>

          {(selected.items || []).map((item) => (
            <div className="detail-row" key={item.id}>
              <div>
                <b>{item.description}</b>
                <small>{item.item_type}</small>
              </div>

              <span>{money(item.amount)}</span>

              <button
                type="button"
                title="Delete component"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 />
              </button>
            </div>
          ))}

          {/* Payment History */}
          <h3>Payment history</h3>

          {(selected.payments || []).map((payment) => (
            <div className="detail-row" key={payment.id}>
              <div>
                <b>{payment.payment_method}</b>

                <small>
                  {new Date(
                    payment.payment_date
                  ).toLocaleDateString()}
                  {' · '}
                  {payment.payment_status}
                </small>
              </div>

              <span>{money(payment.amount)}</span>
            </div>
          ))}

        </div>
      )}

      {/* Modal Forms */}
      {modal && (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={(event) =>
              handleSave(
                event,
                modal === 'payroll'
                  ? createPayroll
                  : modal === 'item'
                    ? addItem
                    : addPayment
              )
            }
          >

            <header>
              <h2>
                {modal === 'payroll'
                  ? 'New payroll'
                  : modal === 'item'
                    ? 'Add salary component'
                    : 'Record payment'}
              </h2>

              <button
                type="button"
                aria-label="Close payroll form"
                disabled={isSaving}
                onClick={() => setModal('')}
              >
                <X />
              </button>
            </header>

            <div className="form-grid">

              {/* New Payroll Form */}
              {modal === 'payroll' && (
                <>
                  <Select
                    label="Personnel"
                    name="person_id"
                    options={people.map((person) => [
                      person.id,
                      person.full_name,
                    ])}
                  />

                  <Field
                    label="Payroll period"
                    name="payroll_period"
                    type="month"
                    required
                  />
                </>
              )}

              {/* Salary Component Form */}
              {modal === 'item' && (
                <>
                  <Select
                    label="Component type"
                    name="item_type"
                    options={[
                      ['Base Salary', 'Base Salary'],
                      ['Bonus', 'Bonus'],
                      ['Allowance', 'Allowance'],
                      ['Deduction', 'Deduction'],
                    ]}
                  />

                  <Field
                    label="Description"
                    name="description"
                    required
                  />

                  <Field
                    label="Amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </>
              )}

              {/* Payment Form */}
              {modal === 'payment' && (
                <>
                  <Field
                    label="Payment date"
                    name="payment_date"
                    type="date"
                    required
                  />

                  <Field
                    label="Amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />

                  <Field
                    label="Method"
                    name="payment_method"
                    required
                  />

                  <Field
                    label="Status"
                    name="payment_status"
                    required
                  />

                  <Field
                    label="Reference"
                    name="reference_number"
                  />
                </>
              )}

            </div>

            <footer>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setModal('')}
              >
                Cancel
              </button>

              <button
                className="primary"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </footer>

          </form>
        </div>
      )}

    </section>
  );
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Format currency
const money = (value) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value) || 0);

// Reusable input field
function Field({ label, ...props }) {
  return (
    <label>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

// Reusable select field
function Select({ label, options, ...props }) {
  return (
    <label>
      <span>{label}</span>

      <select {...props} required>
        <option value="">Select...</option>

        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
