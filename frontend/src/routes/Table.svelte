<script>
	import { onMount } from 'svelte';

//     export async function load({ fetch }) { // destructure `fetch` from the first argument
//     console.log("HERE IN LOAD")
//     // const records = await getAllRecords(1, 10);
//     const response = await fetch('http://localhost:8443/balance'
//         , {
// 			method: "GET", // *GET, POST, PUT, DELETE, etc.
// 			mode: 'cors', // no-cors, *cors, same-origin
// 			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
// 			credentials: 'same-origin', // include, *same-origin, omit
// 			// headers: {
// 			// 	Authorization: 'Basic dXNlcjpwd2Q='
// 			// }
// 		});
//     const records = await response.json();
//     console.log(await records);
//     return records;
// }

	let balance;

	// onMount(async () => {
	// 	fetch('https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=Bourbon')
	// 		.then((response) => response.json())
	// 		.then((data) => {
	// 			console.log(data);
	// 			apiData.set(data);
	// 		})
	// 		.catch((error) => {
	// 			console.log(error);
	// 			return [];
	// 		});
	// });
	// onMount(async () => {
	// 	fetch('http://localhost:8443/balance'
    //     , {
	// 		method: "GET", // *GET, POST, PUT, DELETE, etc.
	// 		mode: 'cors', // no-cors, *cors, same-origin
	// 		cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
	// 		credentials: 'same-origin', // include, *same-origin, omit
	// 		// headers: {
	// 		// 	Authorization: 'Basic dXNlcjpwd2Q='
	// 		// }
	// 	})
    //     // )
	// 	// 	.then(
	// 	// 		(response) => response.json(),
	// 	// 		(response) => console.log('FAIL')
	// 	// 	)
    //     //     .catch((response) => console.log('WUT'))
	// 	// 	.then((data) => console.log(data));
	// });
</script>

<table>
	<tr>
		<th>id</th>
		<th>name</th>
		<th>url</th>
	</tr>

	<!-- {#each $apiData.drinks as drinks}
		<tr>
			<td>{drinks.idDrink}</td>
			<td>{drinks.strDrink}</td>
            <td>{drinks.strDrinkThumb.slice(15,26)}</td>
		</tr>
	{/each} -->
</table>
