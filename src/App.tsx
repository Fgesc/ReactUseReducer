import { useEffect, useReducer, useState, type ChangeEvent } from "react";
import { type User } from "./types";
import "./App.css";

type State =
    | { status: "initial" } 
    | { status: "loading" }
    | { status: "success"; user: User }
    | { status: "not-found" }
    | { status: "error"; message: string };

type Action =
    | { type: "reset_to_initial" }
    | { type: "search_started" }
    | { type: "user_found"; user: User }
    | { type: "user_not_found" }
    | { type: "search_error"; message: string };


function userReducer(state: State, action: Action): State {
    switch (action.type) {
        case "reset_to_initial":
            return { status: "initial" };
        case "search_started":
            return { status: "loading" };
        case "user_found":
            return { status: "success", user: action.user };
        case "user_not_found":
            return { status: "not-found" };
        case "search_error":
            return { status: "error", message: action.message };
        default:
            return state;
    }
}


const App = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [state, dispatch] = useReducer(userReducer, { status: "initial" });

    useEffect(() => {
        const trimQuery = searchQuery.trim();
        if (trimQuery === "") {
            dispatch({ type: "reset_to_initial" });
            return;
        }

        const controller = new AbortController();

        const fetchFunc = async () => {
            dispatch({ type: "search_started" });   

            try {
                const response = await fetch(
                    `https://jsonplaceholder.typicode.com/users?username=${encodeURIComponent(trimQuery)}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const resJson = await response.json();

                const user = resJson.find((u: User) => u.username === trimQuery);

                if (user) {
                    dispatch({ type: "user_found", user });
                }   else {
                        dispatch({ type: "user_not_found" })
                    }

            }   catch (error) {
                    if (error instanceof DOMException && error.name === "AbortError") {
                        return;
                    }
                    const errorMessage = error instanceof Error ? error.message : "Хз, что за ошибка";
                    console.error("Failed to fetch user:", error);
                    dispatch({ type: "search_error", message: errorMessage });
                }
        };

        const timer = setTimeout(fetchFunc, 300);

        return () => {
            clearTimeout(timer);
            controller.abort(); 
        };

    }, [searchQuery]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>  setSearchQuery(e.target.value);

    return (
        <div className="card">
            <input type="search" value={searchQuery} onChange={handleChange} />
            {state.status === "initial" && <p>Enter the username</p>}
            {state.status === "loading" && <p>Searching...</p>}
            {state.status === "success" && (
                <div>
                    <h3>{state.user.name}</h3>
                    <h3>{state.user.username}</h3>
                    <h3>{state.user.email}</h3>
                </div>
            )}
            {state.status === "not-found" && <p>No user found</p>}
            {state.status === "error" && <p>Error: {state.message}</p>}
        </div>
    );
};

export default App;
