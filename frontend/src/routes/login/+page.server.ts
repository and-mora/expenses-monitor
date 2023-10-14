import { fail, redirect } from '@sveltejs/kit';
import { isAuthenticated, user } from '../../store'

/** @type {import('./$types').Actions} */
export const actions = {
    login: async ({ cookies, request }) => {

        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        if (!username) {
            return fail(400, { username, missing: true });
        }

        if (!password) {
            return fail(400, { missingPassword: true });
        }

        var formBody: string[] = [];
        data.forEach((value, key) => {
            const encodedKey = encodeURIComponent(key);
            const encodedValue = encodeURIComponent(value.toString());
            formBody.push(encodedKey + "=" + encodedValue);
        })
        const body = formBody.join("&");

        const loginResponse = await fetch('http://localhost:8443/login',
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
            });

        if (loginResponse.status != 200) {
            return fail(loginResponse.status, { username, incorrect: true });
        }

        // remove old cookie
        cookies.delete('SESSION');

        // set new cookie
        const setCookieHeader = loginResponse.headers.getSetCookie()[0];
        const sessionCookie = setCookieHeader.split(' ')[0].split('=')[1].replace(';', '');

        cookies.set('SESSION', sessionCookie!, {
            path: '/'
        });

        user.set(username.toString());
        console.log("set authenticated true")
        isAuthenticated.set(true);

        throw redirect(302, "/");
    }
};