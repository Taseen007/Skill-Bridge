import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import { getSkillListingById } from "../../config/listings";
import axios from "axios";

export default function SessionBookingForm() {
  const { skillId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // teacherID may come from router state (fast path) or be fetched from the
  // listing (fallback when user navigates directly via URL)
  const [teacherID, setTeacherID] = useState(location.state?.teacherID || null);
  const [form, setForm] = useState({ date: "", time: "", note: "" });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [listingTitle, setListingTitle] = useState("");
  const [fee, setFee] = useState(0);
  const [loadingListing, setLoadingListing] = useState(false);

  // step 1 = pick date/time, step 2 = pay & confirm
  const [step, setStep] = useState(1);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });

  useEffect(() => {
    async function fetchListing() {
      if (!skillId) return;
      setLoadingListing(true);
      try {
        const listing = await getSkillListingById(skillId);
        setAvailableSlots(listing.availableSlots || []);
        setListingTitle(listing.title || "");
        setFee(listing.fee || 0);
        // If teacherID wasn't in router state, pull it from the listing
        if (!teacherID && listing.teacherID) {
          const tid = listing.teacherID._id || listing.teacherID;
          setTeacherID(String(tid));
        }
      } catch (e) {
        setAvailableSlots([]);
      } finally {
        setLoadingListing(false);
      }
    }
    fetchListing();
  }, [skillId]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Prevent booking a past date
  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCardChange = (e) => {
    setCard({ ...card, [e.target.name]: e.target.value });
  };

  const goToPayment = (e) => {
    e.preventDefault();
    if (!teacherID) {
      setMessage("Could not determine teacher. Please go back and try again.");
      setSuccess(false);
      return;
    }
    setMessage("");
    setStep(2);
  };

  const isCardValid =
    card.name.trim().length > 0 &&
    card.number.replace(/\s/g, "").length >= 12 &&
    card.expiry.trim().length > 0 &&
    card.cvv.trim().length >= 3;

  const handlePayAndBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const sessionData = {
        teacherID,
        skillListingID: skillId,
        slotDate: form.date,
        slotTime: form.time,
        note: form.note || "",
        paymentConfirmed: true,
        paymentMethod: `card-ending-${card.number.replace(/\s/g, "").slice(-4)}`,
      };

      await axios.post(
        buildApiUrl(API_ENDPOINTS.SESSIONS.CREATE),
        sessionData,
        { withCredentials: true }
      );

      setMessage("✅ Payment received — session request sent successfully!");
      setSuccess(true);
      setForm({ date: "", time: "", note: "" });
      setCard({ name: "", number: "", expiry: "", cvv: "" });

      setTimeout(() => {
        navigate(`/skills/${skillId}`);
      }, 2000);
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message || err?.message || "❌ Failed to send session request.";
      setMessage(backendMessage);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50 p-6">
      <form
        onSubmit={step === 1 ? goToPayment : handlePayAndBook}
        className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-xl space-y-6 border border-blue-200"
      >
        <h2 className="text-3xl font-bold text-center text-blue-700">
          {step === 1 ? "📅 Book Your 1-on-1 Session" : "💳 Payment"}
        </h2>
        {listingTitle && (
          <p className="text-center text-gray-600 text-sm">
            <span className="font-medium text-gray-800">{listingTitle}</span>
            {fee > 0 && <span className="text-gray-500"> · ৳{fee}/session</span>}
          </p>
        )}

        {loadingListing ? (
          <div className="text-center py-6 text-gray-500">Loading session details…</div>
        ) : step === 1 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  min={today}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Time</label>
                <select
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
                >
                  <option value="">Select Time</option>
                  {availableSlots.length === 0 ? (
                    <option disabled>No slots available</option>
                  ) : (
                    availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  )}
                </select>
                {availableSlots.length === 0 && !loadingListing && (
                  <p className="text-sm text-amber-600 mt-1">
                    This instructor hasn't added available time slots yet. Contact them to arrange a time.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Note to Teacher (optional)
              </label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows="3"
                placeholder="Anything specific you want the teacher to know?"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={!teacherID || availableSlots.length === 0}
              className={`w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition duration-200 ${
                !teacherID || availableSlots.length === 0 ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              Continue to Payment {fee > 0 && `· ৳${fee}`}
            </button>
          </>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-700">Amount due</span>
              <span className="text-2xl font-bold text-blue-700">৳{fee}</span>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Cardholder Name</label>
              <input
                type="text"
                name="name"
                value={card.name}
                onChange={handleCardChange}
                required
                placeholder="Name on card"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Card Number</label>
              <input
                type="text"
                name="number"
                value={card.number}
                onChange={handleCardChange}
                required
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Expiry</label>
                <input
                  type="text"
                  name="expiry"
                  value={card.expiry}
                  onChange={handleCardChange}
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={card.cvv}
                  onChange={handleCardChange}
                  required
                  inputMode="numeric"
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              This is a demo payment form — no real card is charged.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !isCardValid}
                className={`flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex justify-center items-center gap-2 ${
                  loading || !isCardValid ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.372 0 0 5.372 0 12h4z"></path>
                  </svg>
                )}
                {loading ? "Processing…" : `Pay ৳${fee} & Book`}
              </button>
            </div>
          </>
        )}

        {message && (
          <p className={`text-center text-sm font-medium transition duration-300 ${success ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
