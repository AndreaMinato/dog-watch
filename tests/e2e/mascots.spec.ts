import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, joinAsCamera, joinAsViewer, members, openDevice, test } from './devices'

function mascotOf(page: Page, memberName: string) {
  return members(page).filter({ hasText: memberName }).getByRole('img')
}

test('each device sees the other\'s animal in the pose of its role', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea', 'Coniglio')

  for (const page of [camera, viewer]) {
    await expect(mascotOf(page, 'soggiorno')).toHaveAccessibleName('Gatto seduto')
    await expect(mascotOf(page, 'Andrea')).toHaveAccessibleName('Coniglio affacciato')
  }
})

test('a device re-entering a recent room comes back with the same animal', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno', 'Gatto')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea', 'Coniglio')
  await expect(members(camera)).toHaveCount(2)

  await viewer.reload()
  await viewer.getByRole('list', { name: 'Stanze recenti' }).getByRole('button', { name: 'Casa al mare' }).click()
  await camera.reload()

  for (const page of [camera, viewer]) {
    await expect(members(page)).toHaveCount(2)
    await expect(mascotOf(page, 'soggiorno')).toHaveAccessibleName('Gatto seduto')
    await expect(mascotOf(page, 'Andrea')).toHaveAccessibleName('Coniglio affacciato')
  }
})
