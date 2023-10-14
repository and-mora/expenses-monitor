import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from '../store'

// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;
export const ssr = false;

/** @type {import('./$types').PageLoad} */
export async function load({ url, fetch }) {
    console.log("load non server side")

    // return { balance: await response.text() }
}
