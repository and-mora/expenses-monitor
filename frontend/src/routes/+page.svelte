<script>
	import Table from './Table.svelte';
	/** @type {import('./$types').PageData} */
	// export let data;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>Expenses-monitor</h1>

	<!-- {data.balance} -->
	<!-- <Table /> -->
	<!-- <a href="/balba">Aggiungi Pagamento</a> -->
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

</style>
