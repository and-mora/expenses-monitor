import { writable } from 'svelte/store';

/** Store the username logged in.
**/
export const user = writable("");
    // localStorage.user ? JSON.parse(localStorage.getItem("user")!) : null)

export const isAuthenticated = writable(false);
