<template>
    <div>
        <div class="divide-y divide-sky-400">
            <div class="text-sky-500 text-center p-4 font-bold text-2xl">HOGWARTS LOGS</div>
            <div class="mt-4 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4" v-for="encounter in encounters">
                    <div class="border-1 p-4 divide-y divide-sky-300">
                        <div class="flex items-center mb-2">
                            <img
                                src="https://logs.stormforge.gg/images/pve/boss_icon_chess_event.webp?v=U2y6s13jtgz7fubFCmnr7VcgIfRQyRVGC3mx7UY0ETQ"
                                alt="boss-img"/>
                            <p class="text-sky-500 font-bold text-lg" v-text="encounter.title"></p>
                            <a :href="encounter.link" target="_blank" class="ml-auto text-sky-100 hover:text-sky-600">Ссылка
                                на энкаунтер &rarr;</a>
                        </div>
                        <div class="divide-y divide-gray-300/50">
                            <div class="space-y-6 text-base leading-7 text-gray-600">
                                <p class="text-center text-md font-bold text-sky-500">Добыча</p>
                                <ul class="space-y-4">
                                    <li class="flex items-center">
                                        <svg class="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                                             stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="11"/>
                                            <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none"/>
                                        </svg>
                                        <p class="ml-4">
                                            Customizing your
                                            <code class="text-sm font-bold text-gray-900">tailwind.config.js</code> file
                                        </p>
                                    </li>
                                    <li class="flex items-center">
                                        <svg class="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                                             stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="11"/>
                                            <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none"/>
                                        </svg>
                                        <p class="ml-4">
                                            Extracting classes with
                                            <code class="text-sm font-bold text-gray-900">@apply</code>
                                        </p>
                                    </li>
                                    <li class="flex items-center">
                                        <svg class="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                                             stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="11"/>
                                            <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none"/>
                                        </svg>
                                        <p class="ml-4">Code completion with instant preview</p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref} from "vue";

let encounters = ref([]);
const getEncounters = async () => {
    const resp = await fetch('http://localhost:3001/encounters')
    encounters.value = await resp.json()
}
getEncounters()

</script>


<style>
body {
    background-color: rgb(15 23 42);
}
</style>
