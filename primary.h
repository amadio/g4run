#ifndef _PRIMARY_H
#define _PRIMARY_H

#if USE_PYTHIA
#include <Pythia8/Pythia.h>
#endif

#include <G4VUserPrimaryGeneratorAction.hh>

void set_primary_energy(double);
void set_primary_name(const char*);

class G4Event;

class PrimaryGeneratorAction final : public G4VUserPrimaryGeneratorAction {
public:
	PrimaryGeneratorAction();
	void GeneratePrimaries(G4Event*) override;
};

#if USE_PYTHIA
bool use_pythia();
void set_pythia_config(const char*);

class PythiaPrimaryGeneratorAction final : public G4VUserPrimaryGeneratorAction {
public:
	PythiaPrimaryGeneratorAction();
	void GeneratePrimaries(G4Event*) override;
private:
	Pythia8::Pythia pythia;
};
#endif

#endif
