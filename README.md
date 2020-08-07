# g4run - simple generic runner for Geant4 simulations

This program takes as input a GDML file,  a primary particle type and its
initial energy (position is always the origin), an optional a reference physics
list (default is `FTFP_BERT`), and runs an event loop in batch mode or an
interactive session. Its intented use is in profiling and benchmarking Geant4
performance.
