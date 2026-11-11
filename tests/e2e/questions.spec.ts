import type { Locator } from '@playwright/test'
import { expect } from '@playwright/test'
import { cameraThumbnails, createRoom, enter, joinAsCamera, joinAsViewer, next, openCameraMenu, openDevice, openInviteSheet, openWatchers, test, watchers } from './devices'

function drawing(choice: Locator) {
  return choice.getByRole('img')
}

test('a new device starts from what it will do, each choice with the animal in the pose of its role', async ({ browser }) => {
  const page = await openDevice(browser)

  await expect(page.getByRole('heading', { level: 1, name: 'Cosa farà questo dispositivo?' })).toBeVisible()
  await expect(page.getByText('1 di 4')).toBeVisible()
  await expect(drawing(page.getByRole('button', { name: 'Guarderà la casa' }))).toHaveAccessibleName(/ affacciato$/)
  await expect(drawing(page.getByRole('button', { name: 'Farà da telecamera' }))).toHaveAccessibleName(/ seduto$/)
})

test('a future camera without a key creates the room, sees its key in words and enters it', async ({ browser }) => {
  const page = await openDevice(browser)
  await page.getByRole('button', { name: 'Farà da telecamera' }).click()
  await expect(page.getByText('2 di 4')).toBeVisible()

  await page.getByRole('button', { name: 'Non ce l\'ho: crea una Stanza nuova' }).click()
  await expect(page.getByText('2 di 4')).toBeVisible()
  await page.getByLabel('Come si chiama la Stanza?').fill('Casa al mare')
  await page.getByRole('button', { name: 'Crea', exact: true }).click()
  const key = page.getByRole('list', { name: 'Chiave della Stanza' }).getByRole('listitem')
  await expect(key).toHaveCount(4)
  const words = await key.allTextContents()
  await page.getByRole('button', { name: 'Avanti' }).click()

  await expect(page.getByText('3 di 4')).toBeVisible()
  await page.getByRole('button', { name: 'Camera da letto' }).click()
  await expect(page.getByLabel('Che stanza riprende?')).toHaveValue('Camera da letto')
  await page.getByRole('button', { name: 'Avanti' }).click()

  await expect(page.getByText('4 di 4')).toBeVisible()
  const animals = page.getByRole('group', { name: 'Scegli il tuo animale' })
  await expect(animals.getByRole('radio')).toHaveCount(3)
  await expect(animals.getByRole('radio', { checked: true })).toHaveCount(1)
  for (const figure of await animals.getByRole('img').all())
    await expect(figure).toHaveAccessibleName(/ seduto$/)
  await animals.getByRole('radio', { name: 'Gatto', exact: true }).check()
  await page.getByRole('button', { name: 'Entra', exact: true }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Camera da letto' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Gatto seduto', exact: true })).toBeVisible()
  await openCameraMenu(page)
  const invitation = await openInviteSheet(page)
  await expect(invitation.getByRole('list', { name: 'Chiave della Stanza' }).getByRole('listitem')).toHaveText(words.map(word => word.trim()))
})

test('the create address opens the questions at the new room, as a future camera', async ({ browser }) => {
  const page = await openDevice(browser)

  await page.goto('/crea')

  await expect(page.getByText('2 di 4')).toBeVisible()
  await page.getByLabel('Come si chiama la Stanza?').fill('Casa al mare')
  await page.getByRole('button', { name: 'Crea', exact: true }).click()
  await next(page)
  await expect(page.getByLabel('Che stanza riprende?')).toBeVisible()
})

test('going back keeps every answer, and each question takes the focus', async ({ browser }) => {
  const page = await openDevice(browser)
  await page.getByRole('button', { name: 'Guarderà la casa' }).click()
  await page.getByLabel('Hai la Chiave della Stanza?').fill('tazza ombra vento bosco')
  await next(page)
  await page.getByLabel('Come ti chiami?').fill('Andrea')
  await next(page)
  await page.getByRole('radio', { name: 'Gatto', exact: true }).check()
  const back = page.getByRole('button', { name: 'Indietro' })

  await back.click()
  await expect(page.getByLabel('Come ti chiami?')).toHaveValue('Andrea')
  await expect(page.getByLabel('Come ti chiami?')).toBeFocused()
  await back.click()
  await expect(page.getByText('2 di 4')).toBeVisible()
  await expect(page.getByLabel('Hai la Chiave della Stanza?')).toHaveValue('tazza ombra vento bosco')
  await back.click()
  await expect(page.getByRole('heading', { level: 1, name: 'Cosa farà questo dispositivo?' })).toBeFocused()
  await expect(back).toHaveCount(0)

  await page.getByRole('button', { name: 'Guarderà la casa' }).click()
  await expect(page.getByLabel('Hai la Chiave della Stanza?')).toBeFocused()
  await next(page)
  await next(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Scegli il tuo animale' })).toBeFocused()
  await expect(page.getByRole('radio', { name: 'Gatto', exact: true })).toBeChecked()
})

test('a wrong key takes the device back to the key, keeping the other answers', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const page = await openDevice(browser)

  await joinAsViewer(page, 'abaco abete abisso zuppa', 'Andrea', 'Gatto')

  await expect(page.getByRole('alert')).toHaveText('Chiave non valida')
  await expect(page.getByText('2 di 4')).toBeVisible()
  await expect(page.getByLabel('Hai la Chiave della Stanza?')).toHaveValue('abaco abete abisso zuppa')
  await page.getByLabel('Hai la Chiave della Stanza?').fill(key)
  await next(page)
  await expect(page.getByLabel('Come ti chiami?')).toHaveValue('Andrea')
  await next(page)
  await expect(page.getByRole('radio', { name: 'Gatto', exact: true })).toBeChecked()
  await enter(page)
  await expect(cameraThumbnails(page)).toHaveAccessibleName('soggiorno, in diretta')
})

test('a viewer enters with the key, a nickname the others see and an animal', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const page = await openDevice(browser)

  await page.getByRole('button', { name: 'Guarderà la casa' }).click()
  await expect(page.getByText('2 di 4')).toBeVisible()
  const keyField = page.getByLabel('Hai la Chiave della Stanza?')
  await expect(keyField).toHaveAccessibleDescription(/per esempio «tazza ombra vento bosco»/)
  await expect(page.getByRole('button', { name: 'Non ce l\'ho: crea una Stanza nuova' })).toHaveCount(0)
  await keyField.fill(key)
  await next(page)

  await expect(page.getByText('3 di 4')).toBeVisible()
  const nickname = page.getByLabel('Come ti chiami?')
  await expect(nickname).toHaveAccessibleDescription('Lo vedono le telecamere e gli altri che guardano.')
  await nickname.fill('Andrea')
  await next(page)

  await expect(page.getByText('4 di 4')).toBeVisible()
  for (const figure of await page.getByRole('group', { name: 'Scegli il tuo animale' }).getByRole('img').all())
    await expect(figure).toHaveAccessibleName(/ affacciato$/)
  await enter(page, 'Coniglio')

  await expect(cameraThumbnails(page)).toHaveAccessibleName('soggiorno, in diretta')
  await openWatchers(camera)
  await expect(watchers(camera).filter({ hasText: 'Andrea' }).getByRole('img')).toHaveAccessibleName('Coniglio affacciato')
})
