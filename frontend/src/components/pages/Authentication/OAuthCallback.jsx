import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { setUser } from "../../../redux/authSlice";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    const token = params.get("token");
    if (!token) return navigate("/signin", { replace: true });
    const { userId } = jwtDecode(token);
    fetch(`http://localhost:3000/api/v1/user/${userId}`, { credentials: "include", headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then(({ user }) => {
        if (!user) throw new Error("Unable to load account");
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        dispatch(setUser(user));
        navigate("/", { replace: true });
      })
      .catch(() => navigate("/signin?oauthError=1", { replace: true }));
  }, [dispatch, navigate, params]);
  return <div className="p-8 text-center">Completing sign-in…</div>;
}
