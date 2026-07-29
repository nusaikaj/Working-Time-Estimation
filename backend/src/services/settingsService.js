const { WorkingSettings } = require('../models');

/**
 * working_settings is modelled as a single-row table. getOrCreate ensures a
 * row always exists (defensive: normally guaranteed by the seeder) and every
 * caller in the app reads/writes through this one row, identified as the
 * first row found rather than a hardcoded id.
 */
async function getSettings() {
  const [settings] = await WorkingSettings.findOrCreate({
    where: {},
    defaults: { workingStartTime: '08:00:00', workingEndTime: '16:00:00' },
  });
  return settings;
}

async function updateSettings({ workingStartTime, workingEndTime }) {
  const settings = await getSettings();
  settings.workingStartTime = workingStartTime;
  settings.workingEndTime = workingEndTime;
  await settings.save();
  return settings;
}

module.exports = { getSettings, updateSettings };
