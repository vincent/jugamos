import type { RecordModel } from 'pocketbase';
import { client } from '$lib/pocketbase';
import { writable } from 'svelte/store';

export const subscribed = writable(false);

let vapidPublicKey = $state('');

function subscribe(): Promise<RecordModel> {
	if (!vapidPublicKey) return Promise.reject('no public VAPID key');
	return navigator.serviceWorker.ready
		.then((registration) => {
			navigator.serviceWorker.addEventListener('controllerchange', (_) => {
				debugger;
			});

			return registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
			});
		})
		.then((subscription) =>
			client.collection('user_subscriptions').create({
				user: client.authStore.record?.id,
				subscription
			})
		);
}

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function getSubscription() {
	return !('serviceWorker' in navigator)
		? Promise.reject('no service-worker')
		: navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription());
}

export function initMatchNotifications(publicKey: string, shouldSubscribe = false) {
	vapidPublicKey = publicKey;
	subscribed.set(false);

	getSubscription()
		.then<PushSubscription | RecordModel | null>((sub) => {
			if (sub) return Promise.resolve(sub);
			if (shouldSubscribe) subscribe();
			throw new Error('wait until asked to subscribe');
		})
		.then((_) => subscribed.set(true))
		.then((_) => console.debug('subscribed to match notifications'))
		.catch((e) => console.error('cannot use service-worker'));
}
