import { faqItems } from "$lib/server/faq";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => ({ faq: faqItems });
