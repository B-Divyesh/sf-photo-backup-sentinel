# Demo sandbox

Open `/demo/` (or `/?demo=1`) to run the seeded example. It contains two paired HEIC/MOV Live Photos. The external-drive sample has a renamed match for the first still and omits the second still, so the result shows both filename-independent matching and an incomplete Live Photo pair.

The sample check starts automatically. The persistent **Demo — sample data** banner offers **Reset demo** and **Start for real**. Demo reports use IndexedDB database `demo:photo-backup-sentinel`; real checks use `photo-backup-sentinel`. Demo mode never reads or writes the real history database.
