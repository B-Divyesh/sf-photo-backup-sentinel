# Demo sandbox

Open `/demo/` or `/?demo=1`. One click from Home opens a completed sample check.

The sample has two still-plus-MOV Live Photos. The backup renames the first pair and omits the second still image.

The result shows three exact matches, one missing item, one incomplete Live Photo pair, and one readable sample.

The banner always says **Demo — sample data, nothing is saved.** Demo records use IndexedDB database `demo:photo-backup-sentinel`.

Real records use `photo-backup-sentinel`. Demo mode never reads or writes that database.

Reloading reuses the single sample report. **Reset demo** clears and recreates it once.

**Start for real** deletes the entire Demo database before opening Home. It does not change real history.
