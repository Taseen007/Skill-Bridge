"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Heart, Grid3X3, LayoutGrid, Plus, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import FilterSidebar from "./FilterSidebar";
import SkillCard from "./SkillCard";
import SkillCategories from "./SkillCategories";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import ChatBox from "../pages/Chat/ChatBox";
import axios from "axios";
import { toast } from "sonner";
import { canTeach } from "../../utils/roles";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price (Low → High)" },
  { value: "price_desc", label: "Price (High → Low)" },
];

const SkillsDiscovery = () => {
  const user = useSelector((state) => state.auth.user);
  const userCanTeach = canTeach(user?.role);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [level, setLevel] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all | saved

  // A sentinel high enough that "no price filter selected" never excludes a listing
  const NO_PRICE_CAP = 1000000;
  const [filters, setFilters] = useState({
    location: "",
    minRating: 0,
    maxPrice: NO_PRICE_CAP,
    proficiency: "any",
    availableNow: false,
  });
  // The slider's max — tracks the highest fee actually in the current results,
  // so the draggable range always matches real prices instead of a disconnected fixed number
  const [priceCeiling, setPriceCeiling] = useState(5000);
  const [allSkills, setAllSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [skillTags, setSkillTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Teacher-specific state: track whether the teacher has skills but no listings
  const [teacherSkillCount, setTeacherSkillCount] = useState(null); // null = not fetched yet
  const [teacherListingCount, setTeacherListingCount] = useState(null);

  // Read initial view from URL query (e.g., ?view=saved)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "saved") setActiveTab("saved");
  }, []);

  // For teacher/both users: fetch their skill count and listing count so we
  // can show a contextual banner when they have skills but no listings yet.
  useEffect(() => {
    if (!userCanTeach || !user?._id) return;

    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    };

    const headers = { "Content-Type": "application/json" };
    const token = getCookie("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Fetch skills (public endpoint, no auth needed, but send token if present)
    fetch(buildApiUrl(API_ENDPOINTS.SKILLS.BY_ID(user._id)), {
      headers,
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setTeacherSkillCount(d.success ? (d.count ?? d.skills?.length ?? 0) : 0))
      .catch(() => setTeacherSkillCount(0));

    // Fetch this teacher's own listings count
    fetch(buildApiUrl(`/listings/teacher/${user._id}`), {
      headers,
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setTeacherListingCount(d.success ? (d.count ?? d.listings?.length ?? 0) : 0))
      .catch(() => setTeacherListingCount(0));
  }, [userCanTeach, user?._id]);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  // Debounced search: fire 350ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch tags (once on mount)
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const token = getCookie("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(buildApiUrl(API_ENDPOINTS.LISTINGS.TAGS), {
          method: "GET",
          headers,
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setSkillTags(data.tags || []);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };
    fetchTags();
  }, []);

  // --- Fetch from server with query params ---
  const fetchListings = async () => {
    if (activeTab === "saved") {
      // Fetch saved listings route instead
      setLoadingSaved(true);
      try {
        const token = getCookie("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(buildApiUrl(API_ENDPOINTS.LISTINGS.SAVED_LIST), {
          method: "GET",
          headers,
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setAllSkills(data.listings || []);
          setFilteredSkills(data.listings || []);
        } else {
          throw new Error(data.message || "Failed to load saved listings");
        }
      } catch (err) {
        toast.error("You need to be signed in to view saved listings");
        setAllSkills([]);
        setFilteredSkills([]);
      } finally {
        setLoadingSaved(false);
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const token = getCookie("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.set("tags", selectedCategory);
      if (minFee) params.set("minFee", String(minFee));
      if (maxFee) params.set("maxFee", String(maxFee));
      if (filters.minRating > 0) params.set("minRating", String(filters.minRating));
      if (filters.proficiency !== "any") params.set("level", filters.proficiency);
      if (level) params.set("level", level);
      if (sortBy) params.set("sort", sortBy);

      const url = `${buildApiUrl(API_ENDPOINTS.LISTINGS.ALL)}${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { method: "GET", headers, credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch listings");
      }
      const data = await res.json();
      if (data.success) {
        setAllSkills(data.listings || []);
        const fees = (data.listings || []).map((s) => s.fee || 0);
        const highestFee = fees.length > 0 ? Math.max(...fees) : 0;
        setPriceCeiling(Math.max(500, Math.ceil((highestFee || 500) / 500) * 500));
      } else {
        throw new Error(data.message || "Failed to fetch listings");
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, selectedCategory, sortBy, filters.minRating, filters.proficiency, level, minFee, maxFee]);

  // Apply remaining client-side filters (location / availableNow / maxPrice slider)
  useEffect(() => {
    let list = allSkills;
    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      list = list.filter((s) => s.teacherID?.profile?.location?.toLowerCase().includes(loc));
    }
    if (filters.availableNow) {
      list = list.filter((s) => s.availableSlots?.length > 0);
    }
    if (filters.maxPrice) {
      list = list.filter((s) => Number(s.fee) <= Number(filters.maxPrice));
    }
    setFilteredSkills(list);
  }, [allSkills, filters]);

  const handleMessageClick = async (receiver) => {
    try {
      const token = getCookie("token");
      const res = await axios.post(
        "http://localhost:3000/api/v1/chat/chat",
        { userId: receiver._id },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      const chatId = res.data._id;
      setSelectedInstructor({ ...receiver, chatId });
      setChatVisible(true);
    } catch (err) {
      console.error("Error opening chat", err);
    }
  };

  const handleCloseChat = () => {
    setChatVisible(false);
    setSelectedInstructor(null);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
    setMinFee("");
    setMaxFee("");
    setLevel("");
    setFilters({
      location: "",
      minRating: 0,
      maxPrice: NO_PRICE_CAP,
      proficiency: "any",
      availableNow: false,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Skills to Learn</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Browse through hundreds of skill listings and find the perfect course taught by
          experienced instructors. Learn at your own pace with personalized one-on-one sessions.
        </p>
      </div>

      {/* Tabs: All Listings | Saved */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "all"
                ? "bg-white text-indigo-700 shadow-sm border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutGrid size={16} /> All Listings
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "saved"
                ? "bg-white text-indigo-700 shadow-sm border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Heart size={16} /> Saved
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingSaved ? "Loading saved listings..." : "Loading skills..."}</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">Error Loading Skills</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Search Bar + Quick Filters Row */}
          <div className="max-w-6xl mx-auto mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search skills, tags, instructors, or descriptions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min $"
                  value={minFee}
                  onChange={(e) => setMinFee(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max $"
                  value={maxFee}
                  onChange={(e) => setMaxFee(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {activeTab === "all" && (searchQuery || selectedCategory !== "all" || minFee || maxFee || level || filters.minRating > 0 || filters.proficiency !== "any" || filters.location.trim() || filters.maxPrice !== NO_PRICE_CAP || filters.availableNow) && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Skill Categories (tags) — only for "all" tab */}
          {activeTab === "all" && (
            <SkillCategories
              categories={skillTags}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          )}

          <div className="flex gap-8">
            {/* Filter Sidebar */}
            <div className="hidden lg:block w-80">
              <div className="sticky top-20">
                <FilterSidebar filters={filters} onFiltersChange={setFilters} priceCeiling={priceCeiling} />
              </div>
            </div>

            <div className="flex-1">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" /> Filters
                </button>
                {showFilters && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                    <FilterSidebar filters={filters} onFiltersChange={setFilters} priceCeiling={priceCeiling} />
                  </div>
                )}
              </div>

              {/* Teacher banner: shown when the teacher has skills but zero listings */}
              {userCanTeach && teacherSkillCount > 0 && teacherListingCount === 0 && activeTab === "all" && (
                <div className="mb-6 flex items-start gap-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <div className="text-2xl leading-none mt-0.5">🎓</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-900 mb-1">
                      You have {teacherSkillCount} skill{teacherSkillCount !== 1 ? "s" : ""} but no listings yet
                    </p>
                    <p className="text-xs text-indigo-700 mb-3">
                      Learners can't find you until you publish a listing. Create one now to appear in search results.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/listings/add"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition"
                      >
                        <Plus size={13} /> Create a Listing
                      </Link>
                      <Link
                        to="/skills/add"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-indigo-300 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition"
                      >
                        <BookOpen size={13} /> Add Another Skill
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Header */}
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {activeTab === "saved" ? (
                      <>Your Saved Listings ({filteredSkills.length})</>
                    ) : (
                      <>{filteredSkills.length} Skill{filteredSkills.length === 1 ? "" : "s"} Found</>
                    )}
                  </h2>
                  {selectedCategory !== "all" && activeTab === "all" && (
                    <p className="text-gray-600">in <span className="font-medium">{selectedCategory}</span></p>
                  )}
                </div>
                {activeTab === "all" && (
                  <div className="hidden lg:flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSkills.map((skill) => (
                  <SkillCard key={skill._id} skill={skill} onMessageClick={handleMessageClick} />
                ))}
              </div>

              {/* ChatBox */}
              <ChatBox visible={chatVisible} onClose={handleCloseChat} receiver={selectedInstructor} />

              {filteredSkills.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">{activeTab === "saved" ? "💾" : "🔍"}</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {activeTab === "saved" ? "No saved listings yet" : "No skills found"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === "saved"
                      ? "Click the heart on any skill card to save it for later."
                      : "Try adjusting your search criteria or filters."}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {activeTab === "saved" && (
                      <button
                        onClick={() => setActiveTab("all")}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        Browse All Listings
                      </button>
                    )}
                    {/* Teacher CTA: only shown on the "all" tab when no results exist */}
                    {activeTab === "all" && userCanTeach && (
                      <Link
                        to="/listings/add"
                        className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        <Plus size={16} />
                        Create a Listing
                      </Link>
                    )}
                    {activeTab === "all" && userCanTeach && (
                      <Link
                        to="/skills/add"
                        className="inline-flex items-center gap-2 px-5 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium"
                      >
                        <BookOpen size={16} />
                        Add a Skill First
                      </Link>
                    )}
                    {/* Prompt unauthenticated users to sign in */}
                    {activeTab === "all" && !user && (
                      <Link
                        to="/signin"
                        className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        Sign In to Explore More
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SkillsDiscovery;
