<script setup lang="ts">
import { signIn } from '~/lib/auth-client'

definePageMeta({ layout: 'auth' })

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const result = await signIn.email({
      email: email.value,
      password: password.value,
    })
    if (result.error) {
      error.value = result.error.message ?? 'Login gagal'
    }
    else {
      useState('is-authenticated').value = true
      await navigateTo('/')
    }
  }
  catch {
    error.value = 'Terjadi kesalahan. Coba lagi.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>Masuk ke akun Anda</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="email@contoh.com"
            autocomplete="email"
            required
          />
        </div>
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>
        <p v-if="error" class="text-sm text-destructive">
          {{ error }}
        </p>
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Login' }}
        </Button>
      </form>
    </CardContent>
    <CardFooter class="justify-center">
      <p class="text-sm text-muted-foreground">
        Belum punya akun?
        <NuxtLink to="/register" class="text-primary hover:underline font-medium">
          Daftar
        </NuxtLink>
      </p>
    </CardFooter>
  </Card>
</template>
