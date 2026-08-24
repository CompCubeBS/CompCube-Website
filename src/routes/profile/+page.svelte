<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import UserProfile from "$lib/components/UserProfile.svelte";
	import { useAuth } from "$lib/auth.svelte";
	let { data } = $props();
	const auth = useAuth();
</script>

<PageMeta
	title="My profile"
	description="Your CompCube rating, match record, and linked player identity."
	path="/profile" />
<div class="page-shell">
	<UserProfile user={data.user} />
	<div class="profile-actions">
		<Button variant="danger" onclick={() => auth.logout()}
			><i class="pi pi-sign-out"></i>Log out</Button>
	</div>
</div>

<style>
	.profile-actions {
		display: flex;
		justify-content: flex-end;
		padding-bottom: 3rem;
	}
</style>
