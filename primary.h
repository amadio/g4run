#ifndef _PRIMARY_H
#define _PRIMARY_H

#include <G4VUserPrimaryGeneratorAction.hh>

void set_primary_name(const char*);
void set_primary_energy(double);

class G4Event;

class PrimaryGeneratorAction final : public G4VUserPrimaryGeneratorAction {
public:
	PrimaryGeneratorAction();
	void GeneratePrimaries(G4Event*) override;
};

#endif
